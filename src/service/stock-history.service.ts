import { Prisma, StockHistory } from "@prisma/client";
import { prisma } from "../config/database.js";
import {
    StockHistoriesResponseDto,
    StockHistoryResponseDto
} from "../schemas/response/response.dto.js";
import AppError from "../utils/AppError.js";
import { redisOperation } from "../utils/redis.operation.js";

export const getStockHistoryById =
    async (companyId: string, stockHistoryId: string):
        Promise<{
            stockHistory: StockHistoryResponseDto["stockHistory"];
        }> => {

        const stockHistory = await prisma.stockHistory.findFirst({
            where: { id: stockHistoryId, companyId }
        });

        if (!stockHistory) {
            throw new AppError("Stock history not found", 404, "STOCK_HISTORY_NOT_FOUND");
        }

        return {
            stockHistory: mapStockHistory(stockHistory)
        };
    }

export const getStockHistories =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        stockHistories: StockHistoriesResponseDto["stockHistories"];
        total: number
    }> => {

        const key = `company:${companyId}:stockHistories:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.StockHistoryWhereInput = {
            companyId
        };

        const [stockHistories, total] = await Promise.all([
            prisma.stockHistory.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    inventoryId: true,
                    batchId: true,
                    type: true,
                    reason: true,
                    quantity: true,
                    previousQty: true,
                    currentQty: true,
                    remarks: true,
                    companyId: true,
                    createdAt: true,
                    createdBy: true,
                }
            }),
            prisma.stockHistory.count({ where })
        ]);

        if (stockHistories.length === 0) {
            return { stockHistories: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ stockHistories, total })
        );

        return { stockHistories, total };
    }

export function mapStockHistory(stockHistory: StockHistory) {
    return {
        id: stockHistory.id,
        inventoryId: stockHistory.inventoryId,
        batchId: stockHistory.batchId,
        type: stockHistory.type,
        reason: stockHistory.reason,
        quantity: stockHistory.quantity,
        remarks: stockHistory.remarks,
        companyId: stockHistory.companyId,
        createdAt: stockHistory.createdAt,
        createdBy: stockHistory.createdBy
    };
}