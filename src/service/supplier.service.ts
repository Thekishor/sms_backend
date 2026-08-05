import { Prisma, Status, Supplier } from "@prisma/client";
import { prisma } from "../config/database.js";
import { SupplierDto } from "../schemas/request/request.dto.js";
import {
    SupplierResponseDto,
    SuppliersResponseDto
} from "../schemas/response/response.dto.js";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { redisOperation } from "../utils/redis.operation.js";

export const createSupplierService =
    async (data: SupplierDto, companyId: string):
        Promise<{
            supplier: SupplierResponseDto["supplier"]
        }> => {

        const { name, email, phone, address } = data;

        const existsSupplier = await prisma.supplier.findFirst({
            where: {
                companyId,
                OR: [
                    { email }, { phone }
                ]
            }
        });

        if (existsSupplier) {

            if (existsSupplier.email === email && existsSupplier.status === Status.ACTIVE) {
                throw new AppError(
                    "Supplier already exists with this email",
                    409,
                    "SUPPLIER_ALREADY_EXISTS"
                );
            }

            if (existsSupplier.phone === phone && existsSupplier.status === Status.ACTIVE) {
                throw new AppError(
                    "Supplier already exists with this phone number",
                    409,
                    "SUPPLIER_ALREADY_EXISTS"
                );
            }

            // Account exists but is inactive/pending/rejected
            throw new AppError(
                STATUS_ERROR[existsSupplier.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const supplier = await prisma.supplier.create({
            data: {
                name, email, phone, address, companyId
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:suppliers:*`);

        return {
            supplier: mapSupplier(supplier)
        };
    }

export const getAllSuppliersService =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
        companyId: string
    ): Promise<{
        suppliers: SuppliersResponseDto["suppliers"];
        total: number
    }> => {

        const key = `company:${companyId}:suppliers:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SupplierWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
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
                    createdAt: true,
                    updatedAt: true,
                    companyId: true
                }
            }),
            prisma.supplier.count({ where })
        ]);

        if (suppliers.length === 0) {
            return { suppliers: [], total: 0 }
        }

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ suppliers, total })
        )

        return { suppliers, total };
    }

export const getSupplierService =
    async (supplierId: string, companyId: string): Promise<{
        supplier: SupplierResponseDto["supplier"];
    }> => {

        const supplier = await verifySupplier(supplierId, companyId);

        return {
            supplier: mapSupplier(supplier)
        };
    }

export const updateSupplierService =
    async (data: SupplierDto, supplierId: string, companyId: string) => {

        const { name, email, phone, address } = data;

        const supplier = await verifySupplier(supplierId, companyId);

        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
                name, email, phone, address
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:suppliers:*`);

        return {
            supplier: mapSupplier(updatedSupplier)
        };
    }

export const deleteSupplierService =
    async (companyId: string, supplierId: string) => {

        const supplier = await verifySupplier(supplierId, companyId);

        await prisma.supplier.delete({
            where: { id: supplier.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:suppliers:*`);
    }

export const changeSupplierStatusService =
    async (supplierId: string, companyId: string, status: Status):
        Promise<{
            supplier: SupplierResponseDto["supplier"];
        }> => {

        const supplierStatus: Status[] = [Status.ACTIVE, Status.INACTIVE, Status.REJECTED];

        if (!supplierStatus.includes(status)) {
            throw new AppError("Invalid status value", 400, "INVALID_STATUS");
        }

        const supplier = await verifySupplier(supplierId, companyId);

        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
                status
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:suppliers:*`);

        return {
            supplier: mapSupplier(updatedSupplier)
        };
    }

async function verifySupplier(supplierId: string, companyId: string) {

    const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, companyId }
    });

    if (!supplier) {
        throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
    }

    return supplier;
}

export function mapSupplier(supplier: Supplier) {
    return {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        status: supplier.status,
        address: supplier.address,
        companyId: supplier.companyId,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
    }
}