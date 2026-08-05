import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { paginationSchema, paymentSchema } from "../schemas/request/request.dto.js";
import {
    createPayment,
    getPayment,
    getPayments
} from "../service/payment.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from '../config/logger.js';
import AppError from "../utils/AppError.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createPaymentOfStudent =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = paymentSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { payment } = await createPayment(companyId, result.data);

            return res.status(200).send({
                message: "Payment generated successfully",
                payment
            });

        } catch (err) {
            logError("Failed to create payment", err);
            return next(err);
        }
    }

export const getPaymentById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const paymentId = req.params.id;

            const { payment } = await getPayment(companyId, paymentId);

            return res.status(200).send({
                message: "Payment retrieved successfully",
                payment
            });

        } catch (err) {
            logError("Failed to get payment", err);
            return next(err);
        }
    }

export const getAllPayments =
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

            const { payments, total } = await getPayments(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).send({
                message: "Payments retrieved successfully",
                payments, total
            });

        } catch (err) {
            logError("Failed to get payments", err);
            return next(err);
        }
    }