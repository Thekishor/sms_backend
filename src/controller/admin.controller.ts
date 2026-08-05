import { Request, Response, NextFunction } from "express";
import {
    paginationSchema
} from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    register, verifyAccount, forgotPassword,
    resendOtp, resetPassword,
    changedPassword, updateAdminService, getAdminService,
    getAdmins, deleteAdmin, adminStatus,
    getAllCompaniesWithAdminService,
} from "../service/admin.service.js";
import AppError from "../utils/AppError.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import { requireAdmin, requireSuperAdmin } from "../utils/request.util.js";

export const registerAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { admin } = await register(req.body);

            return res.status(201).send({
                message: "Admin registered successfully. Please check your email to verify your account.",
                admin
            });

        } catch (err) {
            logError("Failed to register admin", err);
            return next(err);
        }
    }

export const verifyAccountByAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { admin } = await verifyAccount(req.body);

            return res.status(200).send({
                message: "Account verified successfully",
                admin
            });

        } catch (err) {
            logError("Failed to verify account", err);
            return next(err);
        }
    }

export const resendOtpForAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, type } = req.body;

            await resendOtp(email, type);

            return res.status(200).send({
                message: "OTP resent successfully. Please check your email.",
                email, type
            });

        } catch (err) {
            logError("Failed to resend otp for admin", err);
            return next(err);
        }
    }

export const forgotPasswordAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const email = req.body.email;

            if (!email) {
                throw new AppError("Email address is required", 400, "EMAIL_ADDRESS_REQUIRED");
            }

            await forgotPassword(email);

            return res.status(200).send({
                message: "Password reset OTP sent successfully. Please check your email.",
                email
            });

        } catch (err) {
            logError("Failed to send otp for admin", err);
            return next(err);
        }
    }

export const resetPasswordForAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await resetPassword(req.body);

            return res.status(200).send({
                message: "Password reset successfully",
            });

        } catch (err) {
            logError("Failed to reset password for admin", err);
            return next(err);
        }
    }

export const changedPasswordForAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = requireAdmin(req);
            await changedPassword(req.body, adminId);

            return res.status(200).send({
                message: "Password changed successfully",
            });

        } catch (err) {
            logError("Failed to change password for admin", err);
            return next(err);
        }
    }

export const updateAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.params.id;
            const { admin } = await updateAdminService(req.body, adminId);

            return res.status(200).send({
                message: "Admin updated successfully",
                admin,
            });

        } catch (err) {
            logError("Failed to update admin", err);
            return next(err);
        }
    }

export const changeAdminStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const superAdminId = requireSuperAdmin(req);
            const adminId = req.params.id;
            const status = req.body.status.trim();

            const { admin } = await adminStatus(superAdminId, adminId, status);

            return res.status(200).json({
                message: "Admin status changed successfully",
                admin
            });

        } catch (err) {
            logError("Failed to change admin status", err);
            return next(err);
        }
    }

export const deleteAdminById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const superAdminId = requireSuperAdmin(req);
            const adminId = req.params.id;

            await deleteAdmin(adminId, superAdminId);

            return res.status(200).json({
                message: "Admin deleted successfully"
            });

        } catch (err) {
            logError("Failed to delete admin", err);
            return next(err);
        }
    }

export const getAdminById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const adminId = req.params.id;
            const { admin } = await getAdminService(adminId);

            return res.status(200).json({
                message: "Admin retrieved successfully",
                admin
            });

        } catch (err) {
            logError("Failed to get admin information", err);
            return next(err);
        }
    }

export const getCompaniesWithAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            // only validate
            requireSuperAdmin(req);
            const adminId = req.params.id;

            const { admin } = await getAllCompaniesWithAdminService(adminId);

            return res.status(200).json({
                message: "Admin with Companies retrieved successfully",
                admin
            });

        } catch (err) {
            logError("Failed to get companies with admin", err);
            return next(err);
        }
    }
export const getAllAdmins =
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

            const { admins, total } = await getAdmins(
                superAdminId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Admins retrieved successfully",
                admins, total
            });

        } catch (err) {
            logError("Failed to get admins", err);
            return next(err);
        }
    }