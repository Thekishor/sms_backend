import { logError } from "../config/logger.js";
import { Request, Response, NextFunction } from 'express';
import { getStockHistories, getStockHistoryById } from "../service/stock-history.service.js";
import { parseQuery } from "../utils/query.util.js";
import { requireCompanyId } from "../utils/request.util.js";
import { z } from "zod";
import { paginationSchema } from "../schemas/request/request.dto.js";
import AppError from "../utils/AppError.js";

export const getStockHistory =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const stockHistoryId = req.params.id;

            const { stockHistory } = await getStockHistoryById(companyId, stockHistoryId);

            return res.status(200).send({
                message: "Stock history retrieved successfully.",
                stockHistory
            });

        } catch (err) {
            logError("Failed to get stock history", err);
            return next(err);
        }
    }

export const getAllStockHistory =
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

            const { stockHistories, total } = await getStockHistories(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).send({
                message: "Stock histories retrieved successfully.",
                stockHistories, total
            });

        } catch (err) {
            logError("Failed to get all stock history", err);
            return next(err);
        }
    }