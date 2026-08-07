import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { paginationSchema } from "../schemas/request/request.dto.js";
import { verifyCompany } from "../service/company.service.js";
import {
    cancelTrialSubscriptionService,
    getActiveSubscriptions,
    getAllSubscriptionsService,
    getCompanyActiveSubscriptionService,
    getCompanySubscriptionsService,
    reminderMailForCompany,
    updateSubscriptionService,
} from "../service/subscription.service.js";
import { requireSuperAdmin } from "../utils/request.util.js";
import { parseQuery } from "../utils/query.util.js";

export const getCompanySubscriptions =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const company = await verifyCompany(req.params.id);
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

            const { subscriptions, total } = await getCompanySubscriptionsService(
                skip,
                take,
                search,
                orderBy,
                company.id
            );

            return res.status(200).send({
                message: "Company subscriptions retrieved successfully",
                subscriptions, total
            });
        }
        catch (err) {
            logError("Failed to get company subscription", err);
            return next(err);
        }
    }

export const getActiveCompanySubscriptions =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const company = await verifyCompany(req.params.id);
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

            const { subscriptions, total } = await getActiveSubscriptions(
                skip,
                take,
                search,
                orderBy,
                company.id
            );

            return res.status(200).send({
                message: "Company active subscriptions retrieved successfully",
                subscriptions, total
            });
        }
        catch (err) {
            logError("Failed to get company subscription", err);
            return next(err);
        }
    }

export const getAllSubscriptions =
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

            const { subscriptions, total } = await getAllSubscriptionsService(
                skip,
                take,
                search,
                orderBy,
                superAdminId
            );

            return res.status(200).send({
                message: "Subscriptions retrieved successfully",
                subscriptions, total
            });
        }
        catch (err) {
            logError("Failed to get all subscriptions", err);
            return next(err);
        }
    }

export const updateSubscription =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const superAdminId = requireSuperAdmin(req);
            const subscriptionId = req.params.id;

            const { subscription } = await updateSubscriptionService(superAdminId, subscriptionId);

            return res.status(200).send({
                message: "Subscription cancelled successfully",
                subscription
            });
        }
        catch (err) {
            logError("Failed to cancel subscription", err);
            return next(err);
        }
    }

export const sendReminderMail =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            requireSuperAdmin(req);
            const subscriptionId = req.params.id;

            await reminderMailForCompany(subscriptionId);

            return res.status(200).send({
                message: "Subscription reminder mail send successfully",
            });
        }
        catch (err) {
            logError("Failed to send subscription reminder mail to company", err);
            return next(err);
        }
    }

export const getActiveCompanySubscriptionByAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = req.params.id;

            const { subscription } = await getCompanyActiveSubscriptionService(companyId);

            return res.status(200).send({
                message: "Company subscription retrieved successfully",
                subscription
            });

        } catch (err) {
            logError("Failed to get company subscription for admin", err);
            return next(err);
        }
    }

export const cancelTrialSubscription =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = req.params.id;
            const { subscription } = await cancelTrialSubscriptionService(companyId);

            return res.status(200).send({
                message: "Trial subscription cancelled successfully",
                subscription
            });

        } catch (err) {
            logError("Failed to cancel trial subscription", err);
            return next(err);
        }
    }
