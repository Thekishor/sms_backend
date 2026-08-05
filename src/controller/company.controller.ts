import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError.js";
import { paginationSchema } from "../schemas/request/request.dto.js";
import { logError } from "../config/logger.js";
import { parseQuery } from "../utils/query.util.js";
import { z } from "zod";
import {
    createCompanyService,
    deleteCompanyService, getAllCompanies,
    getAllCompaniesService,
    getCompanyService,
    updateCompanyService, updateCompanyStatus
} from "../service/company.service.js";
import { requireAdmin, requireSuperAdmin } from "../utils/request.util.js";

export const createCompany =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
            const { company } = await createCompanyService(req.body, adminId);

            return res.status(200).json({
                message: "Company registered successfully",
                company,
            })

        } catch (err) {
            logError("Failed to create/register company", err);
            return next(err);
        }

    }

export const deleteCompany =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
            const companyId = req.params.id;

            await deleteCompanyService(companyId, adminId);

            return res.status(200).json({
                message: "Company deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete company", err);
            return next(err);
        }
    }

export const getAllCompaniesByAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
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

            const { companies, total } = await getAllCompaniesService(
                adminId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Companies retrieved successfully",
                companies, total,
            })

        } catch (err) {
            logError("Failed to get all companies", err);
            return next(err);
        }
    }

export const getCompany =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = req.params.id;

            const { company } = await getCompanyService(companyId);

            return res.status(200).json({
                message: "Company retrieved successfully",
                company
            });

        } catch (err) {
            logError("Failed to get company", err);
            return next(err);
        }
    }

export const updateCompany =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
            const companyId = req.params.id;

            const { company } = await updateCompanyService(
                companyId,
                adminId,
                req.body
            );

            return res.status(200).json({
                message: "Company updated successfully",
                company
            })

        } catch (err) {
            logError("Failed to update company", err);
            return next(err);
        }
    }
export const getAllCompaniesBySuperAdmin =
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const superAdminId = requireSuperAdmin(req);
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

            const { companies, total } = await getAllCompanies(
                superAdminId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Companies retrieved successfully",
                companies, total
            });

        } catch (err) {
            logError("Failed to get companies", err);
            return next(err);
        }
    }

export const changedCompanyStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const superAdminId = requireSuperAdmin(req);
            const companyId = req.params.id;
            const status = req.body.status.trim();

            const { company } = await updateCompanyStatus(companyId, status, superAdminId);

            return res.status(200).json({
                message: "Companies status changed successfully",
                company
            });

        } catch (err) {
            logError("Failed to change company status", err);
            return next(err);
        }
    }