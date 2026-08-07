import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { paginationSchema } from "../schemas/request/request.dto.js";
import { requireSuperAdmin } from "../utils/request.util.js";
import {
    getAllSubscriptionPaymentsService,
    getSubscriptionByPaymentService,
    getSubscriptionPaymentByIdService,
    getSubscriptionPaymentsService,
    subscriptionPaymentService
} from "../service/subscription-payment.service.js";
import { parseQuery } from "../utils/query.util.js";

export const createSubscriptionPayment =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const subscriptionId = req.params.id;
            const superAdminId = requireSuperAdmin(req);

            const { subscriptionPayment } = await subscriptionPaymentService(
                subscriptionId,
                superAdminId,
                req.body
            )

            return res.status(200).send({
                message: "Subscription payment created successfully",
                subscriptionPayment
            });

        } catch (err) {
            logError("Failed to create subscription payment", err);
            return next(err);
        }
    }

export const getSubscriptionPaymentById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const subscriptionId = req.params.id;

            const { subscriptionPayment, } = await getSubscriptionPaymentByIdService(
                subscriptionId
            );

            return res.status(200).send({
                message: "Subscription payment retrieved successfully",
                subscriptionPayment
            });

        }
        catch (err) {
            logError("Failed to get subscription payment", err);
            return next(err);
        }
    }

export const getSubscriptionPayments =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const subscriptionId = req.params.id;
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

            const { subscriptionPayments, total } = await getSubscriptionPaymentsService(
                skip,
                take,
                search,
                orderBy,
                subscriptionId
            );

            return res.status(200).send({
                message: "Subscription payments retrieved successfully",
                subscriptionPayments, total
            });

        }
        catch (err) {
            logError("Failed to get subscription payments", err);
            return next(err);
        }
    }

export const getSubscriptionByPaymentId =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const subscriptionPaymentId = req.params.id;

            const { subscriptionPayment } = await getSubscriptionByPaymentService(
                subscriptionPaymentId
            );

            return res.status(200).send({
                message: "Subscription payment retrieved successfully",
                subscriptionPayment
            });
        }
        catch (err) {
            logError("Failed to get subscription payment", err);
            return next(err);
        }
    }

export const getAllSubscriptionPayments =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

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

            const { subscriptionPayments, total } = await getAllSubscriptionPaymentsService(
                skip,
                take,
                search,
                orderBy,
            );

            return res.status(200).send({
                message: "All Subscription payments retrieved successfully",
                subscriptionPayments, total
            });
        }
        catch (err) {
            logError("Failed to get all subscription payments", err);
            return next(err);
        }
    }