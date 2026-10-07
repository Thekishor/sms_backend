import { Request, Response, NextFunction } from "express";
import { PaginationQuery } from "../schemas/request/request.dto.js";
import {
    createPayment,
    getPayment,
    getPayments
} from "../service/payment.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from '../config/logger.js';
import { requireCompanyId } from "../utils/request.util.js";

export const createPaymentOfStudent =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const { payment } = await createPayment(companyId, req.body);

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
            const query = res.locals.query as PaginationQuery;
            const { skip, take, search, orderBy } = parseQuery(query);

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