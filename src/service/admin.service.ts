import { prisma } from "../config/prisma.js";
import {
    ChangePasswordDto,
    CreateAdminDto,
    OTPVerificationDto,
    ResetPasswordDto,
    UpdateAdminDto,
} from "../schemas/request/request.dto.js";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { checkPassword, hashPassword } from "../utils/hash.js";
import { Admin, OtpType, Prisma, Role, Status } from "@prisma/client";
import { sendEmail } from "./email.service.js";
import { generateOtp } from "../utils/code.generate.js";
import { EMAIL_TEMPLATES, OTP_TEMPLATE } from "../utils/templates.js";
import { AttemptOtpCount } from "../dto/UserDto.js";
import logger from "../config/logger.js";
import {
    AdminResponseDto, AdminsResponseDto,
    AdminWithCompaniesResponseDto,
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { mapCompany } from "./company.service.js";
import { createNotificationForAdmin, createNotificationForSuperAdmin } from "./notification.service.js";

export const register =
    async (data: CreateAdminDto):
        Promise<{
            admin: AdminResponseDto["admin"]
        }> => {

        const { fullName, email, phone, password, address } = data;

        const otpAttemptsKey = `otp:attempts:admin:${email}:${OtpType.EMAIL_VERIFICATION}`;

        const OTP_RESEND_MS = 120000;

        const existingAdmin = await prisma.admin.findFirst({
            where: {
                OR: [
                    { email }, { phone }
                ]
            }
        });

        if (existingAdmin) {

            if (existingAdmin.email === email && existingAdmin.status === Status.ACTIVE) {
                throw new AppError(
                    "Admin already exists with this email",
                    409,
                    "ADMIN_ALREADY_EXISTS"
                );
            }

            if (existingAdmin.phone === phone && existingAdmin.status === Status.ACTIVE) {
                throw new AppError(
                    "Admin already exists with this phone number",
                    409,
                    "ADMIN_ALREADY_EXISTS"
                );
            }

            logger.info("Admin already found with an account", { email });

            if (existingAdmin.status === Status.UNVERIFIED) {

                const otpAttempts = await redisOperation.get(otpAttemptsKey);

                let parsedOtpCount;

                if (otpAttempts != null) {

                    parsedOtpCount = JSON.parse(otpAttempts);

                    const timeSinceLastOtp = Date.now() - (parsedOtpCount.otpSendAt ?? 0);

                    if (timeSinceLastOtp < OTP_RESEND_MS) {
                        throw new AppError(
                            "Your account is not verified. Please check your email for the code",
                            403,
                            "UNVERIFIED_ACCOUNT"
                        )
                    }
                }

                await resendOtp(email, OtpType.EMAIL_VERIFICATION);

                throw new AppError(
                    "Your account is not verified. A new verification code has been sent to your email",
                    403,
                    "UNVERIFIED_ACCOUNT"
                );
            }

            throw new AppError(
                STATUS_ERROR[existingAdmin.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const passwordHash = await hashPassword(password);

        const registerAdmin = await prisma.admin.create({
            data: {
                fullName,
                email,
                password: passwordHash,
                phone,
                address,
                status: Status.UNVERIFIED
            }
        });

        // Save notification in database for super admins
        await createNotificationForSuperAdmin(
            "New Admin Registered",
            `A new admin has registered in the system: ${registerAdmin.fullName}.`,
            "new_admin",
            { admin: registerAdmin }
        );

        let otp: string;
        try {
            otp = await generateOtpAndStoreInRedis(email, OtpType.EMAIL_VERIFICATION);
        } catch {
            // Redis is down — roll back the created admin so the user can retry registration
            await prisma.admin.delete({ where: { id: registerAdmin.id } });
            throw new AppError(
                "Registration service is temporarily unavailable. Please try again shortly.",
                503,
                "SERVICE_UNAVAILABLE"
            );
        }

        const { subject, title, message, expiry } = EMAIL_TEMPLATES.EMAIL_VERIFICATION;

        await sendEmailToAdmin(subject, title, message, expiry, email, otp);
        return {
            admin: mapAdmin(registerAdmin)
        };
    }

export const verifyAccount =
    async (data: OTPVerificationDto):
        Promise<{
            admin: AdminResponseDto["admin"];
        }> => {

        const { otp, email } = data;

        const otpAdminKey = `otp:${OtpType.EMAIL_VERIFICATION}:admin:${email}`;
        const otpAttemptsKey = `otp:attempts:admin:${email}:${OtpType.EMAIL_VERIFICATION}`;

        // get otp from redis
        let registerAdminOtp: string | null;
        try {
            registerAdminOtp = await redisOperation.get(otpAdminKey);
        } catch {
            throw new AppError("Verification service temporarily unavailable. Please try again shortly.", 503, "SERVICE_UNAVAILABLE");
        }

        if (!registerAdminOtp) {
            throw new AppError("Expired OTP", 404, "OTP_EXPIRED");
        }

        const adminOtp = JSON.parse(registerAdminOtp);

        if (String(adminOtp) !== String(otp)) {
            throw new AppError("Invalid OTP", 400, "INVALID_OTP");
        }

        const updatedAdmin = await prisma.admin.update({
            where: { email },
            data: {
                status: Status.PENDING
            }
        });

        // del from redis
        await redisOperation.del(otpAdminKey);
        await redisOperation.del(otpAttemptsKey);
        await redisOperation.del(`superadmin:*:admins*`);

        return {
            admin: mapAdmin(updatedAdmin)
        };
    }

export const resendOtp =
    async (email: string, type: OtpType) => {
        const otpAttemptsKey = `otp:attempts:admin:${email}:${type}`;

        // get from redis
        let adminAttempts: string | null;
        let adminAttemptsTime: number;
        try {
            adminAttempts = await redisOperation.get(otpAttemptsKey);
            adminAttemptsTime = await redisOperation.ttl(otpAttemptsKey);
        } catch {
            throw new AppError(
                "Verification service is temporarily unavailable. Please try again shortly.",
                503,
                "SERVICE_UNAVAILABLE"
            );
        }

        if (!adminAttempts) {
            throw new AppError(
                "Admin account not found. Please register again.",
                400,
                "ADMIN_NOT_FOUND"
            );
        }

        const otpAttempts = JSON.parse(adminAttempts);
        let attemptOtpCount: AttemptOtpCount;

        if (otpAttempts.isBlocked) {

            if (otpAttempts.blockedUntil && new Date(otpAttempts.blockedUntil) > new Date()) {

                // get ttl
                const ttlAttemptOtp = await redisOperation.ttl(otpAttemptsKey);

                const min = Math.floor(ttlAttemptOtp / 60);
                const sec = ttlAttemptOtp % 60;

                throw new AppError(
                    `You are temporarily blocked from requesting OTP. Please try again after ${min} minutes and ${sec} seconds`,
                    403,
                    "OTP_RATE_LIMITED"
                );
            } else {
                attemptOtpCount = {
                    attemptCount: 0,
                    maxAttemptCount: otpAttempts.maxAttemptCount,
                    isBlocked: false,
                }
            }

            // set to redis
            await redisOperation.setEx(otpAttemptsKey, adminAttemptsTime, JSON.stringify(attemptOtpCount));
        }

        if (otpAttempts.attemptCount >= otpAttempts.maxAttemptCount) {

            attemptOtpCount = {
                attemptCount: otpAttempts.attemptCount,
                maxAttemptCount: otpAttempts.maxAttemptCount,
                isBlocked: true,
                blockedUntil: new Date(Date.now() + 10 * 60 * 1000),
                otpSendAt: 0
            };

            // set to redis
            await redisOperation.setEx(otpAttemptsKey, adminAttemptsTime, JSON.stringify(attemptOtpCount));

            throw new AppError(
                "Maximum OTP resend limit reached. Please try again after 10 minutes",
                403,
                "TOO_MANY_ATTEMPTS"
            );
        }

        const otp = generateOtp();

        const otpAdminKey = `otp:${type}:admin:${email}`;

        // set to redis
        try {
            await redisOperation.setEx(otpAdminKey, 120, JSON.stringify(otp));
        } catch {
            throw new AppError(
                "Verification service is temporarily unavailable. Please try again shortly.",
                503,
                "SERVICE_UNAVAILABLE"
            );
        }

        attemptOtpCount = {
            attemptCount: otpAttempts.attemptCount + 1,
            maxAttemptCount: otpAttempts.maxAttemptCount,
            isBlocked: otpAttempts.isBlocked,
            otpSendAt: Date.now()
        };

        // set to redis
        await redisOperation.setEx(otpAttemptsKey, adminAttemptsTime, JSON.stringify(attemptOtpCount));

        const {
            subject,
            title,
            message,
            expiry
        } = EMAIL_TEMPLATES[type === OtpType.EMAIL_VERIFICATION ? "EMAIL_VERIFICATION" : "PASSWORD_RESET"];

        await sendEmailToAdmin(subject, title, message, expiry, email, otp);
    }

export const forgotPassword =
    async (email: string) => {

        await verifyAdmin(email);

        const otpAttemptsKey = `otp:attempts:admin:${email}:${OtpType.PASSWORD_RESET}`;
        const otpAttempts = await redisOperation.get(otpAttemptsKey);
        const OTP_RESEND_MS = 120000;

        let parsedOtpCount;

        if (otpAttempts !== null) {
            parsedOtpCount = JSON.parse(otpAttempts);
        }

        const timeSinceLastOtp = Date.now() - (parsedOtpCount.otpSendAt ?? 0);

        if (timeSinceLastOtp < OTP_RESEND_MS) {
            throw new AppError(
                "OTP already sent, please check your email",
                403,
                "FORGOT_PASSWORD"
            )
        }

        const otp = await generateOtpAndStoreInRedis(email, OtpType.PASSWORD_RESET);

        const { subject, title, message, expiry } = EMAIL_TEMPLATES.PASSWORD_RESET;

        await sendEmailToAdmin(subject, title, message, expiry, email, otp);
    }

export const resetPassword =
    async (data: ResetPasswordDto) => {

        const { email, otp, newPassword } = data;
        const admin = await verifyAdmin(email);

        const otpAdminKey = `otp:${OtpType.PASSWORD_RESET}:admin:${email}`;
        const otpAttemptsKey = `otp:attempts:admin:${email}:${OtpType.PASSWORD_RESET}`;

        // get from redis
        const adminOtp = await redisOperation.get(otpAdminKey);

        if (!adminOtp) {
            throw new AppError("OTP expired. Please request a new one", 404, "OTP_EXPIRED");
        }

        if (String(adminOtp) !== String(otp)) {
            throw new AppError("Invalid OTP", 400, "INVALID_OTP");
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.admin.update({
            where: { id: admin.id },
            data: { password: passwordHash }
        });

        // del from redis
        await redisOperation.del(otpAdminKey);
        await redisOperation.del(otpAttemptsKey);
    }

export const changedPassword =
    async (data: ChangePasswordDto, adminId: string) => {

        const { oldPassword, newPassword } = data;

        const admin = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const isPasswordValid = await checkPassword(oldPassword, admin.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
        }

        if (oldPassword === newPassword) {
            throw new AppError("New password must be different from old password", 400, "SAME_PASSWORD");
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.admin.update({
            where: { id: admin.id },
            data: { password: passwordHash }
        });

    }

export const getAdminService =
    async (adminId: string): Promise<{
        admin: AdminResponseDto["admin"];
    }> => {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!admin) {
            throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
        }

        return { admin };
    }

export const getAdmins =
    async (
        superAdminId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        admins: AdminsResponseDto["admins"];
        total: number;
    }> => {

        const key = `superadmin:${superAdminId}:admins:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        // get from redis
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.AdminWhereInput = {
            role: Role.ADMIN,
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [admins, total] = await Promise.all([
            prisma.admin.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    address: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.admin.count({ where })
        ])

        if (admins.length === 0) {
            return { admins: [], total: 0 }
        }

        // set into redis
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ admins, total })
        );

        return { admins, total };

    }

export const getAllCompaniesWithAdminService =
    async (adminId: string):
        Promise<{
            admin: AdminWithCompaniesResponseDto["admin"];
        }> => {

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                companies: true
            }
        });

        if (!admin) {
            throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
        }

        const { companies } = admin;

        return {
            admin: {
                ...admin,
                companies: companies.map(company => mapCompany(company))
            }
        }
    }

export const deleteAdmin =
    async (adminId: string, superAdminId: string) => {

        const admin = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
        }

        await prisma.admin.delete({
            where: { id: adminId }
        });

        // delete from redis
        await redisOperation.del(`superadmin:*:admins:*`);
    }

export const adminStatus =
    async (superAdminId: string, adminId: string, status: Status): Promise<{
        admin: AdminResponseDto["admin"];
    }> => {

        const adminStatus: Status[] = [
            Status.ACTIVE,
            Status.REJECTED,
            Status.INACTIVE,
            Status.PENDING,
            Status.UNVERIFIED
        ];

        if (!adminStatus.includes(status)) {
            throw new AppError("Invalid status value", 400, "INVALID_STATUS");
        }

        const updatedAdmin = await prisma.admin.update({
            where: {
                id: adminId,
            },
            data: {
                status,
                approvedBy: superAdminId
            }
        });

        // save notification in database for admin
        await createNotificationForAdmin(
            updatedAdmin.id,
            "Account Status Updated",
            `Your account status has been changed to ${updatedAdmin.status}.`,
            "admin_status_updated",
            { admin: updatedAdmin }
        )

        // del from redis
        await redisOperation.del(`superadmin:*:admins:*`);

        return {
            admin: mapAdmin(updatedAdmin)
        }

    }

export const updateAdminService =
    async (data: UpdateAdminDto, adminId: string): Promise<{
        admin: AdminResponseDto["admin"];
    }> => {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: {
                fullName: data.fullName,
                address: data.address,
            }
        });

        // del from redis
        await redisOperation.del(`superadmin:*: admins:*`);

        return {
            admin: mapAdmin(updatedAdmin)
        }
    }

async function verifyAdmin(email: string) {

    const admin = await prisma.admin.findUnique({
        where: { email }
    });

    if (!admin) {
        throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
    }

    if (admin.status !== Status.ACTIVE) {
        throw new AppError("Access denied. Account is not active yet", 403, "ACCESS_DENIED");
    }

    return admin;
}

async function generateOtpAndStoreInRedis(email: string, type: string) {

    const otp = generateOtp();

    const otpAdminKey = `otp:${type}:admin:${email}`;

    // set into redis
    await redisOperation.setEx(otpAdminKey, 120, JSON.stringify(otp));

    //otp attempts count
    const attemptOtpCount: AttemptOtpCount = {
        attemptCount: 1,
        maxAttemptCount: 3,
        isBlocked: false,
        otpSendAt: Date.now()
    };

    const otpAttemptsKey = `otp:attempts:admin:${email}:${type}`;

    // set to redis
    await redisOperation.setEx(otpAttemptsKey, 86400, JSON.stringify(attemptOtpCount));

    return otp;
}

export function mapAdmin(admin: Admin) {
    return {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        address: admin.address,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
    }
}

async function sendEmailToAdmin(
    subject: string,
    title: string,
    message: string,
    expiry: string,
    email: string,
    otp: string
) {
    const html = OTP_TEMPLATE(title, message, otp, expiry);
    await sendEmail(email, subject, html);
}