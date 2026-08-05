import { Request, Response, NextFunction } from 'express';
import {
    inventorySchema,
    paginationSchema,
    purchaseStockSchema,
    stockOutSchema,
} from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    createInventoryService,
    deleteInventory,
    getInventories,
    getInventory,
    getStockAlertsService,
    getStockHistoryService,
    getStockSummaryService,
    issueInventoryService,
    purchaseInventoryService,
    updateInventory
} from "../service/inventory.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from '../config/logger.js';
import AppError from '../utils/AppError.js';
import { requireCompanyId, requireUser } from '../utils/request.util.js';

export const createInventory =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const createdBy = requireUser(req);

            const result = inventorySchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { inventory } = await createInventoryService(companyId, createdBy, result.data);

            return res.status(201).json({
                message: 'Inventory created successfully.',
                inventory
            });

        } catch (err) {
            logError("Failed to create inventory", err);
            return next(err);
        }
    }

export const getInventoryById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;

            const { inventory } = await getInventory(companyId, inventoryId);

            return res.status(200).json({
                message: 'Inventory retrieved successfully.',
                inventory
            });

        } catch (err) {
            logError("Failed to get inventory", err);
            return next(err);
        }
    }

export const getAllInventories =
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

            const { inventories, total } = await getInventories(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: 'Inventories retrieved successfully.',
                inventories, total
            });

        } catch (err) {
            logError("Failed to get inventories", err);
            return next(err);
        }
    }

export const updateInventoryById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;
            const result = inventorySchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { inventory } = await updateInventory(companyId, inventoryId, result.data);

            return res.status(200).json({
                message: 'Inventory updated successfully.',
                inventory
            });

        } catch (err) {
            logError("Failed to update inventory", err);
            return next(err);
        }
    }

export const deleteInventoryById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;

            await deleteInventory(companyId, inventoryId);

            return res.status(200).json({
                message: 'Inventory deleted successfully.',
            });

        } catch (err) {
            logError("Failed to delete inventory", err);
            return next(err);
        }
    }

export const purchaseInventory =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;
            const createdBy = requireUser(req);

            const result = purchaseStockSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { purchaseInventory } = await purchaseInventoryService(
                result.data,
                companyId,
                createdBy,
                inventoryId
            );

            return res.status(200).json({
                message: 'Stock purchased successfully.',
                purchaseInventory
            });

        } catch (err) {
            logError("Failed to purchase inventory", err);
            return next(err);
        }
    }

export const issueInventory =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;
            const createdBy = requireUser(req);

            const result = stockOutSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { issueInventory } = await issueInventoryService(
                result.data,
                companyId,
                createdBy,
                inventoryId
            )

            return res.status(200).json({
                message: 'Stock issued successfully.',
                issueInventory
            });

        } catch (err) {
            logError("Failed to issue inventory", err);
            return next(err);
        }
    }

export const getInventoryStockHistory =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const inventoryId = req.params.id;

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

            const { stockHistories, total } = await getStockHistoryService(
                companyId,
                inventoryId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: 'Stock histories retrieved successfully.',
                stockHistories,
                total
            });

        } catch (err) {
            logError("Failed to get inventory stock history", err);
            return next(err);
        }
    }

export const getStockAlerts =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);

            const { stockAlerts } = await getStockAlertsService(companyId);

            return res.status(200).send({
                message: "Stock alerts information",
                stockAlerts
            });

        } catch (err) {
            logError("Failed to get stock alert information", err);
            return next(err);
        }
    }

export const getStockSummary =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);

            const { stockSummary } = await getStockSummaryService(companyId);

            return res.status(200).send({
                message: "Stock summary information",
                stockSummary
            });

        } catch (err) {
            logError("Failed to get stock summary", err);
            return next(err);
        }
    }