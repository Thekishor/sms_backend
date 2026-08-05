import { BatchDto } from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { Batch, Prisma, Status } from "@prisma/client";
import {
    BatchesResponseDto,
    BatchesWithStudentsResponseDto,
    BatchResponseDto
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";

export const createBatchService =
    async (data: BatchDto, companyId: string):
        Promise<{
            batch: BatchResponseDto["batch"];
        }> => {

        const { name, startDate, capacity } = data;

        const existsBatch = await prisma.batch.findFirst({
            where: { name, companyId }
        });

        if (existsBatch) {
            throw new AppError("Batch already exists", 409, "BATCH_ALREADY_EXISTS");
        }

        const batch = await prisma.batch.create({
            data: {
                name,
                startDate,
                capacity,
                companyId,
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:batches:*`);

        return {
            batch: mapBatch(batch)
        };
    }

export const getBatch =
    async (companyId: string, batchId: string):
        Promise<{
            batch: BatchResponseDto["batch"];
        }> => {

        const batch = await verifyBatch(batchId, companyId);

        return {
            batch: mapBatch(batch)
        };
    }

export const getBatches =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        batches: BatchesResponseDto["batches"];
        total: number;
    }> => {

        const key = `company:${companyId}:batches:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.BatchWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { companyId: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [batches, total] = await Promise.all([
            prisma.batch.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    startDate: true,
                    capacity: true,
                    companyId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.batch.count({ where })
        ])

        if (batches.length === 0) {
            return { batches: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ batches, total }));

        return { batches, total };
    }

export const getBatchesWithStudents =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        batches: BatchesWithStudentsResponseDto["batches"];
        total: number;
    }> => {

        const key = `company:${companyId}:batches:students:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.BatchWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                ]
            })
        }

        const [batches, total] = await Promise.all([
            prisma.batch.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    startDate: true,
                    capacity: true,
                    companyId: true,
                    createdAt: true,
                    updatedAt: true,
                    students: {
                        where: {
                            status: Status.ACTIVE
                        },
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            address: true,
                            guardianName: true,
                            guardianPhone: true,
                            joiningDate: true,
                            status: true,
                            courseId: true,
                            createdAt: true,
                            updatedAt: true,
                            batchId: true,
                            companyId: true
                        }
                    }
                }
            }),
            prisma.batch.count({ where })
        ]);

        if (batches.length === 0) {
            return { batches: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ batches, total }));

        return { batches, total };
    }

export const deleteBatchService =
    async (companyId: string, batchId: string) => {

        const batch = await verifyBatch(batchId, companyId);

        await prisma.batch.delete({
            where: { id: batch.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:batches:*`);
    }

export const updateBatchService =
    async (companyId: string, batchId: string, data: BatchDto):
        Promise<{
            batch: BatchResponseDto["batch"];
        }> => {

        const batch = await verifyBatch(batchId, companyId);

        const updatedBatch = await prisma.batch.update({
            where: { id: batch.id },
            data: {
                name: data.name,
                startDate: data.startDate,
                capacity: data.capacity,
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:batches:*`);

        return {
            batch: mapBatch(updatedBatch)
        }
    }

export async function verifyBatch(batchId: string, companyId: string) {

    const batch = await prisma.batch.findFirst({
        where: { id: batchId, companyId }
    });

    if (!batch) {
        throw new AppError("Batch not found", 404, "BATCH_NOT_FOUND");
    }

    return batch;
}

export function mapBatch(batch: Batch) {
    return {
        id: batch.id,
        name: batch.name,
        startDate: batch.startDate,
        capacity: batch.capacity,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        companyId: batch.companyId,
    }
}