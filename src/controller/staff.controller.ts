import { Request, Response, NextFunction } from "express";
import {
    paginationSchema,
} from "../schemas/request/request.dto.js";
import {
    changedStaffStatusService,
    changePasswordForStaffService,
    createStaffService, deleteStaffService,
    getAllStaffService,
    getStaffService, updateStaffService
} from "../service/staff.service.js";
import AppError from "../utils/AppError.js";
import z from "zod";
import { logError } from '../config/logger.js';
import { parseQuery } from "../utils/query.util.js";
import { requireAdmin, requireCompanyId } from "../utils/request.util.js";

export const createStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
            const companyId = requireCompanyId(req);

            const { staff } = await createStaffService(req.body, adminId, companyId);

            return res.status(200).json({
                message: "Staff created successfully",
                staff
            });

        } catch (err) {
            logError("Failed to create staff", err);
            return next(err);
        }

    }

export const deleteStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = requireCompanyId(req);
            const staffId = req.params.id;

            await deleteStaffService(staffId, companyId);

            return res.status(200).json({
                message: "Staff deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete staff", err);
            return next(err);
        }
    }

export const getAllStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
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

            const { staffs, total } = await getAllStaffService(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Staffs retrieved successfully",
                staffs, total,
            });

        } catch (err) {
            logError("Failed to get all staffs", err);
            return next(err);
        }
    }

export const getStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = requireCompanyId(req);
            const staffId = req.params.id;

            const { staff } = await getStaffService(staffId, companyId);

            return res.status(200).json({
                message: "Staff retrieved successfully",
                staff
            });

        } catch (err) {
            logError("Failed to get staff", err);
            return next(err);
        }
    }

export const changedStaffStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = requireCompanyId(req);
            const staffId = req.params.id;
            const status = req.body.status.trim();

            const { staff } = await changedStaffStatusService(companyId, staffId, status);

            return res.status(200).send({
                message: "Staff status updated successfully",
                staff
            });

        } catch (err) {
            logError("Failed to changed staff status", err);
            return next(err);
        }
    }

export const updateStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = requireCompanyId(req);
            const staffId = req.params.id;

            const { staff } = await updateStaffService(req.body, staffId, companyId);

            return res.status(200).json({
                message: "Staff updated successfully",
                staff
            });

        } catch (err) {
            logError("Failed to update staff", err);
            return next(err);
        }
    }

export const changePasswordForStaff =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireAdmin(req);
            const companyId = requireCompanyId(req);
            const staffId = req.params.id;

            await changePasswordForStaffService(req.body, staffId, companyId);

            return res.status(200).json({
                message: "Password changed successfully",
            });

        } catch (err) {
            logError("Failed to change password", err);
            return next(err);
        }
    }