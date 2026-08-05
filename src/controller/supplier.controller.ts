import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logError } from "../config/logger.js";
import { paginationSchema, supplierSchema } from "../schemas/request/request.dto.js";
import {
    changeSupplierStatusService,
    createSupplierService,
    deleteSupplierService,
    getAllSuppliersService,
    getSupplierService,
    updateSupplierService
} from "../service/supplier.service.js";
import { parseQuery } from "../utils/query.util.js";
import AppError from "../utils/AppError.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createSupplier =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = supplierSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { supplier } = await createSupplierService(result.data, companyId);

            return res.status(200).send({
                message: "Supplier created successfully",
                supplier
            });

        } catch (err) {
            logError("Failed to create supplier", err);
            return next(err);
        }
    }

export const getAllSuppliers =
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

            const { suppliers, total } = await getAllSuppliersService(
                skip,
                take,
                search,
                orderBy,
                companyId
            );

            return res.status(200).send({
                message: "Suppliers retrieved successfully",
                suppliers, total
            });

        } catch (err) {
            logError("Failed to get suppliers", err);
            return next(err);
        }
    }

export const getSupplier =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const supplierId = req.params.id;

            const { supplier } = await getSupplierService(supplierId, companyId);

            return res.status(200).send({
                message: "Supplier retrieved successfully",
                supplier
            });

        } catch (err) {
            logError("Failed to get supplier", err);
            return next(err);
        }
    }

export const updateSupplier =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const supplierId = req.params.id;

            const result = supplierSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { supplier } = await updateSupplierService(result.data, supplierId, companyId);

            return res.status(200).send({
                message: "Supplier updated successfully",
                supplier
            });

        } catch (err) {
            logError("Failed to update supplier", err);
            return next(err);
        }
    }

export const deleteSupplier =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const supplierId = req.params.id;

            await deleteSupplierService(companyId, supplierId);

            return res.status(200).send({
                message: "Supplier deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete supplier", err);
            return next(err);
        }
    }

export const changeSupplierStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const supplierId = req.params.id;
            const status = req.body.status.trim();

            const { supplier } = await changeSupplierStatusService(supplierId, companyId, status);

            return res.status(200).send({
                message: "Supplier status changed successfully",
                supplier
            });

        } catch (err) {
            logError("Failed to change status", err);
            return next(err);
        }
    }