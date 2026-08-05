import { Request, Response, NextFunction } from "express";
import { batchSchema, paginationSchema } from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    createBatchService,
    deleteBatchService,
    getBatch,
    getBatches,
    getBatchesWithStudents,
    updateBatchService
} from "../service/batch.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createBatch =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = batchSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { batch } = await createBatchService(result.data, companyId);

            return res.status(200).json({
                message: "Batch created successfully",
                batch
            });

        } catch (err) {
            logError("Failed to create batch", err);
            return next(err);
        }
    }

export const getBatchById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const batchId = req.params.id;

            const { batch } = await getBatch(companyId, batchId);

            return res.status(200).json({
                message: "Batch retrieved successfully",
                batch
            });

        } catch (err) {
            logError("Failed to get batch by Id", err);
            return next(err);
        }
    }

export const getAllBatches =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = paginationSchema.safeParse(req.query);

            if (!result.success) {
                throw new AppError(
                    "Validation failed",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { skip, take, search, orderBy } = parseQuery(result.data);

            const { batches, total } = await getBatches(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Batches retrieved successfully",
                batches, total,
            });

        } catch (err) {
            logError("Failed to get batches", err);
            return next(err);
        }
    }

export const getAllBatchesWithStudents =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = paginationSchema.safeParse(req.query);

            if (!result.success) {
                throw new AppError(
                    "Validation failed",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { skip, take, search, orderBy } = parseQuery(result.data);

            const { batches, total } = await getBatchesWithStudents(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Batches with students retrieved successfully",
                batches: batches,
                total: total,
            });

        } catch (err) {
            logError("Failed to get batches with students", err);
            return next(err);
        }
    }

export const deleteBatch =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const batchId = req.params.id;

            await deleteBatchService(companyId, batchId);

            return res.status(200).json({
                message: "Batch deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete batch", err);
            return next(err);
        }
    }

export const updateBatch =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const batchId = req.params.id;
            const result = batchSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { batch } = await updateBatchService(companyId, batchId, result.data);

            return res.status(200).json({
                message: "Batch updated successfully",
                batch
            });

        } catch (err) {
            logError("Failed to update batch", err);
            return next(err);
        }
    }