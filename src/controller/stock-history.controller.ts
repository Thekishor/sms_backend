import { logError } from "../config/logger.js";
import { Request, Response, NextFunction } from 'express';
import { getStockHistories, getStockHistoryById } from "../service/stock-history.service.js";
import { parseQuery } from "../utils/query.util.js";
import { requireCompanyId } from "../utils/request.util.js";
import { PaginationQuery } from "../schemas/request/request.dto.js";

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
            const query = res.locals.query as PaginationQuery;
            const { skip, take, search, orderBy } = parseQuery(query);

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