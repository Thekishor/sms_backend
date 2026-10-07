import { Request, Response, NextFunction } from "express";
import { logError } from "../config/logger.js";
import { PaginationQuery } from "../schemas/request/request.dto.js";
import {
    changeSupplierStatusService,
    createSupplierService,
    deleteSupplierService,
    getAllSuppliersService,
    getSupplierService,
    updateSupplierService
} from "../service/supplier.service.js";
import { parseQuery } from "../utils/query.util.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createSupplier =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const { supplier } = await createSupplierService(req.body, companyId);

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
            const query = res.locals.query as PaginationQuery;
            const { skip, take, search, orderBy } = parseQuery(query);

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
            const { supplier } = await updateSupplierService(req.body, supplierId, companyId);

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