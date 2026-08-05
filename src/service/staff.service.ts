import {
    ChangeStaffPasswordDto,
    StaffDto,
    UpdateStaffDto
} from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { hashPassword } from "../utils/hash.js";
import { Prisma, Staff, Status } from "@prisma/client";
import {
    StaffResponseDto,
    StaffsResponseDto
} from "../schemas/response/response.dto.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { redisOperation } from "../utils/redis.operation.js";

export const createStaffService =
    async (data: StaffDto, adminId: string, companyId: string):
        Promise<{
            staff: StaffResponseDto["staff"];
        }> => {

        const { fullName, email, phone, address, password, roles, permissions } = data;

        const existsStaff = await prisma.staff.findFirst({
            where: {
                OR: [{ email }, { phone }]
            }
        });

        if (existsStaff) {

            if (existsStaff.email === email && existsStaff.status === Status.ACTIVE) {
                throw new AppError(
                    "A staff member with this email already exists",
                    409,
                    "STAFF_ALREADY_EXISTS"
                );
            }

            if (existsStaff.phone === phone && existsStaff.status === Status.ACTIVE) {
                throw new AppError(
                    "A staff member with this phone number already exists",
                    409,
                    "STAFF_ALREADY_EXISTS"
                );
            }

            // Account exists but is inactive/pending/rejected
            throw new AppError(
                STATUS_ERROR[existsStaff.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const permissionValues = Object.values(PERMISSIONS);

        const invalidPermissions = permissions.filter(p => !permissionValues.includes(p));

        if (invalidPermissions.length > 0) {
            throw new AppError("Invalid permissions provided", 400, "INVALID_PERMISSIONS");
        }

        const passwordHash = await hashPassword(password);

        const staff = await prisma.staff.create({
            data: {
                fullName,
                email,
                phone,
                password: passwordHash,
                roles,
                permissions,
                address,
                status: Status.ACTIVE,
                companyId,
                createdBy: adminId,
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:staffs:*`);

        return {
            staff: mapStaff(staff)
        };
    }

export const deleteStaffService =
    async (staffId: string, companyId: string) => {

        const staff = await verifyStaff(staffId, companyId);

        await prisma.staff.delete({
            where: { id: staff.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:staffs:*`);
    }

export const changedStaffStatusService =
    async (
        companyId: string,
        staffId: string,
        status: Status
    ): Promise<{
        staff: StaffResponseDto["staff"];
    }> => {

        const staffStatus: Status[] = [Status.ACTIVE, Status.INACTIVE, Status.PENDING, Status.REJECTED];

        if (!staffStatus.includes(status)) {
            throw new AppError("Invalid status value", 400, "INVALID_STATUS");
        }

        const staff = await verifyStaff(staffId, companyId);

        const updatedStaff = await prisma.staff.update({
            where: { id: staff.id },
            data: {
                status
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:staffs:*`);

        return {
            staff: mapStaff(updatedStaff)
        };
    }

export const getAllStaffService =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        staffs: StaffsResponseDto["staffs"];
        total: number
    }> => {

        const key = `company:${companyId}:staffs:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.StaffWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [staffs, total] = await Promise.all([
            prisma.staff.findMany({
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
                    status: true,
                    roles: true,
                    permissions: true,
                    companyId: true,
                    createdBy: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.staff.count({ where })
        ]);

        if (staffs.length === 0) {
            return { staffs: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ staffs, total }));

        return { staffs, total };
    }

export const getStaffService =
    async (staffId: string, companyId: string):
        Promise<{
            staff: StaffResponseDto["staff"];
        }> => {

        const staff = await verifyStaff(staffId, companyId);

        return {
            staff: mapStaff(staff)
        };
    }

export const updateStaffService =
    async (data: UpdateStaffDto, staffId: string, companyId: string):
        Promise<{
            staff: StaffResponseDto["staff"];
        }> => {

        const staff = await verifyStaff(staffId, companyId);

        const updatedStaff = await prisma.staff.update({
            where: { id: staff.id },
            data: {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                roles: data.roles,
                permissions: data.permissions
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:staffs:*`);

        return {
            staff: mapStaff(updatedStaff)
        };
    }

export const changePasswordForStaffService =
    async (data: ChangeStaffPasswordDto, staffId: string, companyId: string) => {

        const staff = await verifyStaff(staffId, companyId);

        const passwordHash = await hashPassword(data.newPassword);

        await prisma.staff.update({
            where: { id: staff.id },
            data: { password: passwordHash }
        });
    }

async function verifyStaff(staffId: string, companyId: string) {

    const staff = await prisma.staff.findFirst({
        where: { id: staffId, companyId }
    });

    if (!staff) {
        throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");
    }

    return staff;
}

export function mapStaff(staff: Staff) {
    return {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        address: staff.address,
        roles: staff.roles,
        permissions: staff.permissions,
        status: staff.status,
        createdBy: staff.createdBy,
        companyId: staff.companyId,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt
    }
}
