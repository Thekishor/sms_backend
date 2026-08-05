import { Request, Response, NextFunction } from 'express';
import { feeAccountSchema, paginationSchema } from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    createFeeAccount,
    getFeeAccount,
    getFeeAccounts
} from "../service/fee-account.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from '../config/logger.js';
import AppError from '../utils/AppError.js';
import { requireCompanyId } from '../utils/request.util.js';

export const createFeeForStudent =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = feeAccountSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { feeAccount } = await createFeeAccount(companyId, result.data);

            return res.status(200).send({
                message: "FeeAccount created successfully",
                feeAccount
            });

        } catch (err) {
            logError("Failed to create fee account", err);
            return next(err);
        }
    }

export const getFeeAccountById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const feeAccountId = req.body.id;

            const { feeAccount } = await getFeeAccount(companyId, feeAccountId);

            return res.status(200).send({
                message: "FeeAccount retrieved successfully",
                feeAccount
            });

        } catch (err) {
            logError("Failed to get fee account by Id", err);
            return next(err);
        }
    }

export const getAllFeeAccounts =
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

            const { feeAccounts, total } = await getFeeAccounts(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).send({
                message: "FeeAccounts retrieved successfully",
                feeAccounts, total,
            });

        } catch (err) {
            logError("Failed to get fee accounts", err);
            return next(err);
        }
    }