import {
    InventoryDto,
    PurchaseStockDto,
    StockOutDto
} from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import {
    generateBatchNumber,
    generateSku
} from "../utils/code.generate.js";
import AppError from "../utils/AppError.js";
import {
    Inventory,
    InventoryBatch,
    Prisma,
    StockHistory,
    StockMovementReason,
    StockMovementType
} from "@prisma/client";
import {
    InventoriesResponseDto,
    InventoryResponseDto,
    IssueInventoryDto,
    PurchaseInventoryDto,
    StockAlertsDto,
    StockHistoriesResponseDto,
    StockSummaryDto,
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";

export const createInventoryService =
    async (companyId: string, createdBy: string, data: InventoryDto):
        Promise<{
            inventory: InventoryResponseDto["inventory"];
        }> => {

        const { name, minStock, measures, description } = data;

        const existsInventory = await prisma.inventory.findFirst({
            where: { name, companyId }
        });

        if (existsInventory) {
            throw new AppError("Inventory already exists", 409, "INVENTORY_ALREADY_EXISTS");
        }

        const skuCode = generateSku();

        const inventory = await prisma.inventory.create({
            data: {
                name,
                sku: skuCode,
                quantity: 0,
                description,
                minStock,
                measures,
                companyId,
                createdBy
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:inventories:*`);

        return {
            inventory: mapInventory(inventory)
        }
    }

export const getInventory =
    async (companyId: string, inventoryId: string):
        Promise<{
            inventory: InventoryResponseDto["inventory"];
        }> => {

        const inventory = await verifyInventory(inventoryId, companyId);

        return {
            inventory: mapInventory(inventory)
        }
    }

export const getInventories =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        inventories: InventoriesResponseDto["inventories"];
        total: number
    }> => {

        const key = `company:${companyId}:inventories:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.InventoryWhereInput = {
            companyId
        }

        const [inventories, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    quantity: true,
                    description: true,
                    minStock: true,
                    measures: true,
                    companyId: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: true
                }
            }),
            prisma.inventory.count({ where })
        ])

        if (inventories.length === 0) {
            return { inventories: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ inventories, total }));

        return { inventories, total };
    }

export const updateInventory =
    async (companyId: string, inventoryId: string, data: InventoryDto):
        Promise<{
            inventory: InventoryResponseDto["inventory"];
        }> => {

        const { name, minStock, measures, description } = data;

        const inventory = await verifyInventory(inventoryId, companyId);

        const updatedInventory = await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
                name,
                minStock,
                measures,
                description,
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:inventories:*`);

        return {
            inventory: mapInventory(updatedInventory)
        }
    }

export const deleteInventory =
    async (companyId: string, inventoryId: string) => {

        const inventory = await verifyInventory(inventoryId, companyId);

        await prisma.inventory.delete({
            where: { id: inventory.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:inventories:*`);
    }

export const purchaseInventoryService =
    async (data: PurchaseStockDto, companyId: string, createdBy: string, inventoryId: string): Promise<{
        purchaseInventory: PurchaseInventoryDto["purchaseInventory"];
    }> => {

        const { reason, quantity, remarks, supplierId, purchasePrice, expiryDate } = data;

        const inventory = await verifyInventory(inventoryId, companyId);

        const supplier = await prisma.supplier.findFirst({
            where: { id: supplierId, companyId }
        });

        if (!supplier) {
            throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
        }

        if (reason !== StockMovementReason.PURCHASE) {
            throw new AppError("Only PURCHASE reason is allowed for stock-in", 400, "INVALID_STOCK_IN_REASON");
        }

        // total price
        const totalPrice = new Prisma.Decimal(purchasePrice).mul(quantity);

        const newQuantity = inventory.quantity + quantity;

        // transaction all 
        return await prisma.$transaction(async (tx) => {

            // create batch
            const inventoryBatch = await tx.inventoryBatch.create({
                data: {
                    inventoryId,
                    batchNumber: await generateBatchNumber(tx, companyId),
                    supplierId,
                    quantity,
                    purchasePrice,
                    totalPrice,
                    remainingQty: quantity,
                    purchaseDate: new Date(),
                    companyId,
                    expiryDate
                }
            });

            // update inventory
            const updatedInventory = await tx.inventory.update({
                where: { id: inventoryId },
                data: {
                    quantity: newQuantity,
                }
            });

            // create stock history
            const stockHistory = await tx.stockHistory.create({
                data: {
                    inventoryId: inventoryId,
                    batchId: inventoryBatch.id,
                    type: StockMovementType.IN,
                    reason,
                    quantity,
                    createdBy,
                    remarks,
                    companyId,
                }
            });

            return {
                purchaseInventory: {
                    inventory: mapInventory(updatedInventory),
                    inventoryBatch: mapInventoryBatch(inventoryBatch),
                    stockHistory: mapStockHistory(stockHistory)
                }
            };
        });
    }

export const issueInventoryService =
    async (data: StockOutDto, companyId: string, createdBy: string, inventoryId: string): Promise<{
        issueInventory: IssueInventoryDto["issueInventory"]
    }> => {

        const { reason, quantity, remarks } = data;

        const inventory = await verifyInventory(inventoryId, companyId);

        const allowedReason: StockMovementReason[] = [
            StockMovementReason.DAMAGE,
            StockMovementReason.ISSUE,
            StockMovementReason.LOST,
            StockMovementReason.MANUAL_ADJUSTMENT,
            StockMovementReason.RETURN
        ];

        if (!allowedReason.includes(reason)) {
            throw new AppError("Invalid reason for stock out inventory", 400, "INVALID_STOCK_OUT_REASON");
        }

        if (quantity > inventory.quantity) {
            throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
        }

        const today = new Date();

        const batches = await prisma.inventoryBatch.findMany({
            where: {
                companyId,
                inventoryId,
                remainingQty: { gt: 0 }
            },
            orderBy: [
                { expiryDate: { sort: "asc", nulls: "last" } },
                { createdAt: "asc" }
            ]
        });

        // filter out already expired batches
        const validBatches = batches.filter(b =>
            b.expiryDate === null || b.expiryDate > today
        );

        if (validBatches.length === 0) {
            throw new AppError("No valid stock available", 400, "INVALID_STOCK");
        }

        // deduct from batches in FEFO order
        let remaining = quantity;

        const deductions: { batchId: string; deduct: number }[] = [];

        for (const batch of validBatches) {

            if (remaining <= 0) break;

            const deduct = Math.min(batch.remainingQty, remaining);
            remaining = remaining - deduct;

            deductions.push({ batchId: batch.id, deduct });
        }

        if (remaining > 0) {
            throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
        }

        // transaction 
        return await prisma.$transaction(async (tx) => {

            // update inventory batch
            await Promise.all(
                deductions.map(({ batchId, deduct }) =>
                    tx.inventoryBatch.update({
                        where: { id: batchId },
                        data: {
                            remainingQty: {
                                decrement: deduct
                            }
                        }
                    })
                )
            );

            // update inventory
            const updatedInventory = await tx.inventory.update({
                where: { id: inventoryId },
                data: {
                    quantity: {
                        decrement: quantity
                    }
                }
            });

            // create stock history
            const stockHistories = await Promise.all(
                deductions.map(({ batchId, deduct }) =>
                    tx.stockHistory.create({
                        data: {
                            inventoryId,
                            batchId,
                            type: StockMovementType.OUT,
                            reason,
                            quantity: deduct,
                            createdBy,
                            remarks,
                            companyId
                        }
                    })
                )
            );

            return {
                issueInventory: {
                    inventory: mapInventory(updatedInventory),
                    deductions,
                    stockHistories
                }
            }
        });
    }

export const getStockHistoryService =
    async (
        companyId: string,
        inventoryId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        stockHistories: StockHistoriesResponseDto["stockHistories"];
        total: number
    }> => {

        const inventory = await verifyInventory(inventoryId, companyId);

        const key = `company:${companyId}:inventory:${inventoryId}:stockHistories:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.StockHistoryWhereInput = {
            inventoryId: inventory.id,
            companyId
        }

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
                    createdBy: true,
                    remarks: true,
                    companyId: true,
                    createdAt: true,
                }
            }),
            prisma.stockHistory.count({ where })
        ]);

        if (stockHistories.length === 0) {
            return { stockHistories: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ stockHistories, total }));

        return { stockHistories, total };

    }

export const getStockAlertsService =
    async (companyId: string): Promise<{
        stockAlerts: StockAlertsDto["stockAlerts"]
    }> => {

        const today = new Date();
        const in30Days = new Date();
        in30Days.setDate(today.getDate() + 30);

        const batches = await prisma.inventoryBatch.findMany({
            where: {
                companyId
            },
            orderBy: [
                { expiryDate: { sort: "asc", nulls: "last" } },
                { createdAt: "asc" }
            ]
        });

        const inventories = await prisma.inventory.findMany({
            where: {
                companyId
            },
            orderBy: [
                { createdAt: "asc" }
            ]
        });

        return {
            stockAlerts: {

                // batches expiring within 30 days
                expiringSoon: batches.filter(batch =>
                    batch.expiryDate &&
                    batch.expiryDate >= today &&
                    batch.expiryDate <= in30Days &&
                    batch.remainingQty > 0
                ).map(batch => ({
                    ...batch,
                    expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : "",
                    purchasePrice: batch.purchasePrice.toString(),
                    totalPrice: batch.totalPrice.toString(),
                })),

                // already expired
                expired: batches.filter(batch =>
                    batch.expiryDate && batch.expiryDate < today && batch.remainingQty > 0
                ).map(batch => ({
                    ...batch,
                    expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : "",
                    purchasePrice: batch.purchasePrice.toString(),
                    totalPrice: batch.totalPrice.toString(),
                })),

                // running low on stock
                lowStock: inventories.filter(inventory => inventory.quantity <= inventory.minStock),

                // no expiry date set
                noExpiry: batches.filter(batch => batch.expiryDate === null)
                    .map(batch => ({
                        ...batch,
                        expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : "",
                        purchasePrice: batch.purchasePrice.toString(),
                        totalPrice: batch.totalPrice.toString(),
                    })),

                // out of stock
                outOfStock: inventories.filter(inventory => inventory.quantity === 0)
            }
        }
    }

export const getStockSummaryService =
    async (companyId: string): Promise<{
        stockSummary: StockSummaryDto["stockSummary"]
    }> => {

        // count total products
        const totalInventory = await prisma.inventory.count({
            where: {
                companyId
            }
        });

        // count total suppliers
        const totalSuppliers = await prisma.supplier.count({
            where: {
                companyId
            }
        });

        // out of stock
        const outOfStock = await prisma.inventory.count({
            where: {
                quantity: 0,
                companyId
            }
        });

        // low stock inventory
        const inventories = await prisma.inventory.findMany({
            where: {
                companyId
            }
        });

        const lowStock = inventories.filter(
            inventory => inventory.quantity <= inventory.minStock
        ).length;

        // total batch count
        const totalBatch = await prisma.inventoryBatch.count({
            where: {
                companyId
            }
        });

        // total stock history count
        const totalStockHistory = await prisma.stockHistory.count({
            where: {
                companyId
            }
        });

        return {
            stockSummary: {
                totalInventory,
                totalSuppliers,
                outOfStock,
                lowStock,
                totalBatch,
                totalStockHistory
            }
        }

    }

async function verifyInventory(inventoryId: string, companyId: string) {

    const inventory = await prisma.inventory.findFirst({
        where: { id: inventoryId, companyId }
    });

    if (!inventory) {
        throw new AppError("Inventory not found", 404, "INVENTORY_NOT_FOUND");
    }

    return inventory;
}

export function mapInventory(inventory: Inventory) {
    return {
        id: inventory.id,
        name: inventory.name,
        sku: inventory.sku,
        quantity: inventory.quantity,
        description: inventory.description,
        minStock: inventory.minStock,
        measures: inventory.measures,
        companyId: inventory.companyId,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        createdBy: inventory.createdBy,
    };
}

export function mapInventoryBatch(batch: InventoryBatch) {
    return {
        id: batch.id,
        inventoryId: batch.inventoryId,
        batchNumber: batch.batchNumber,
        supplierId: batch.supplierId,
        quantity: batch.quantity,
        remainingQty: batch.remainingQty,
        purchaseDate: batch.purchaseDate,
        purchasePrice: batch.purchasePrice.toString(),
        totalPrice: batch.totalPrice.toString(),
        expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : null,
        companyId: batch.companyId,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
    };
}

export function mapStockHistory(history: StockHistory) {
    return {
        id: history.id,
        inventoryId: history.inventoryId,
        batchId: history.batchId,
        type: history.type,
        reason: history.reason,
        quantity: history.quantity,
        remarks: history.remarks,
        companyId: history.companyId,
        createdBy: history.createdBy,
        createdAt: history.createdAt,
    };
}

