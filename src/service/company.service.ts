import { CompanyDto } from "../schemas/request/request.dto.js";
import {
    CompaniesResponseDto,
    CompanyResponseDto
} from "../schemas/response/response.dto.js";
import { prisma } from "../config/prisma.js";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { Company, Prisma, Status, SubscriptionPaymentStatus, SubscriptionType } from "@prisma/client";
import { redisOperation } from "../utils/redis.operation.js";
import { RealtimeService } from "../socket/realtime.service.js";
import { createNotificationForSuperAdmin } from "./notification.service.js";

export const createCompanyService =
    async (data: CompanyDto, adminId: string):
        Promise<{
            company: CompanyResponseDto["company"];
        }> => {

        const { name, email, phone, address } = data;

        // name must be unique per admin/owner
        const companyByName = await prisma.company.findFirst({
            where: {
                name,
                createdBy: adminId
            }
        });

        if (companyByName) {
            throw new AppError(
                "A company with this name already exists",
                409,
                "COMPANY_ALREADY_EXISTS"
            );
        }

        // email or phone must be unique
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (company) {

            if (company.email === email && company.status === Status.ACTIVE) {
                throw new AppError(
                    "A company with this email already exists",
                    409,
                    "COMPANY_EMAIL_ALREADY_EXISTS"
                );
            }

            if (company.phone === phone && company.status === Status.ACTIVE) {
                throw new AppError(
                    "A company with this phone number already exists",
                    409,
                    "COMPANY_PHONE_ALREADY_EXISTS"
                );
            }

            throw new AppError(
                STATUS_ERROR[company.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const createdCompany = await prisma.company.create({
            data: {
                name, email, phone, address, createdBy: adminId, status: Status.PENDING
            }
        });

        const subStart = new Date();
        const subEnd = new Date(subStart);
        subEnd.setDate(subEnd.getDate() + 15);
        let duration = Math.ceil((subEnd.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24));

        await prisma.subscription.create({
            data: {
                companyId: createdCompany.id,
                type: SubscriptionType.TRIAL,
                duration,
                startDate: subStart,
                endDate: subEnd,
                amount: new Prisma.Decimal(0),
                paymentStatus: SubscriptionPaymentStatus.NOT_APPLICABLE
            }
        });

        // Save notification in database for super admins
        await createNotificationForSuperAdmin(
            "New Company Registered",
            `A new company has registered: ${createdCompany.name}`,
            "new_company",
            { company: createdCompany }
        );

        // del from redis
        await redisOperation.del(`admin:${adminId}:companies:*`);

        return {
            company: mapCompany(createdCompany)
        };
    }

export const deleteCompanyService =
    async (companyId: string, adminId: string) => {

        const company = await verifyCompany(companyId);

        await prisma.company.delete({
            where: { id: company.id },
        });

        // delete from redis
        await redisOperation.del(`admin:${adminId}:companies:*`);
    }

export const getAllCompaniesService =
    async (
        adminId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        companies: CompaniesResponseDto["companies"];
        total: number
    }> => {

        const key = `admin:${adminId}:companies:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.CompanyWhereInput = {
            createdBy: adminId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    status: true,
                    createdBy: true,
                    createdAt: true,
                    updatedAt: true,
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            type: true,
                            status: true,
                            startDate: true,
                            endDate: true
                        }
                    }
                },
            }),
            prisma.company.count({ where }),
        ]);

        if (companies.length === 0) {
            return { companies: [], total: 0 };
        }

        // redis store (10 min)
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ companies, total })
        );

        return { companies, total };
    }

export const getCompanyService =
    async (companyId: string): Promise<{
        company: CompanyResponseDto["company"];
    }> => {

        const company = await verifyCompany(companyId);

        return {
            company: mapCompany(company)
        };
    }

export const updateCompanyService =
    async (companyId: string, adminId: string, data: CompanyDto):
        Promise<{
            company: CompanyResponseDto["company"];
        }> => {

        const { name, email, phone, address } = data;

        const company = await verifyCompany(companyId);

        const updatedCompany = await prisma.company.update({
            where: {
                id: company.id
            },
            data: {
                name, email, phone, address,
            }
        });

        // delete from redis
        await redisOperation.del(`admin:${adminId}:companies:*`);

        return {
            company: mapCompany(updatedCompany)
        };
    }

export const getAllCompanies =
    async (
        superAdminId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        companies: CompaniesResponseDto["companies"];
        total: number;
    }> => {

        const key = `superadmin:${superAdminId}:companies:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.CompanyWhereInput = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    status: true,
                    createdBy: true,
                    createdAt: true,
                    updatedAt: true,
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            type: true,
                            status: true,
                            startDate: true,
                            endDate: true
                        }
                    }
                }
            }),
            prisma.company.count({ where })
        ])

        if (companies.length === 0) {
            return { companies: [], total: 0 };
        }

        // set data into redis
        await redisOperation.setEx(key, 180, JSON.stringify({ companies, total }));

        return { companies, total };
    }

export const updateCompanyStatus =
    async (companyId: string, status: Status, superAdminId: string):
        Promise<{
            company: CompanyResponseDto["company"];
        }> => {

        const companyStatus: Status[] = [Status.ACTIVE, Status.INACTIVE, Status.PENDING, Status.REJECTED];

        if (!companyStatus.includes(status)) {
            throw new AppError("Invalid status value", 400, "INVALID_STATUS");
        }

        const company = await prisma.company.findUnique({
            where: {
                id: companyId,
            }
        });

        if (!company) {
            throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
        }

        const updatedCompany = await prisma.company.update({
            where: {
                id: company.id
            },
            data: {
                status
            }
        });

        // notify admin (socket.io)
        RealtimeService.notifyAdmin(
            updatedCompany.createdBy,
            "active_company",
            {
                message: `Company status updated to ${status}`,
                company: {
                    id: updatedCompany.id,
                    name: updatedCompany.name,
                    email: updatedCompany.email,
                    phone: updatedCompany.phone,
                    address: updatedCompany.address,
                    status: updatedCompany.status,
                    createdBy: updatedCompany.createdBy,
                    createdAt: updatedCompany.createdAt,
                    updatedAt: updatedCompany.updatedAt,
                }
            }
        )

        // also notify super admin room so their companies list updates live
        RealtimeService.notifySuperAdmin(
            "company_status_updated",
            {
                companyId: updatedCompany.id,
                status: updatedCompany.status,
            }
        );

        // delete from redis
        await redisOperation.del(`superadmin:${superAdminId}:companies:*`);
        await redisOperation.del(`admin:${updatedCompany.createdBy}:companies:*`);

        return {
            company: mapCompany(updatedCompany)
        };
    }

export async function verifyCompany(companyId: string) {

    const company = await prisma.company.findUnique({
        where: {
            id: companyId,
        }
    });

    if (!company) {
        throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
    }

    if (company.status !== Status.ACTIVE) {
        throw new AppError(
            `Access denied. Company is ${company.status.toLowerCase()}.`,
            403,
            `COMPANY_${company.status}`
        );
    }

    return company;
}

export function mapCompany(company: Company) {
    return {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        status: company.status,
        createdBy: company.createdBy,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
    }
}