import { Request, Response, NextFunction } from 'express';
import { PaginationQuery } from "../schemas/request/request.dto.js";
import {
    createFeeAccount,
    getFeeAccount,
    getFeeAccounts
} from "../service/fee-account.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from '../config/logger.js';
import { requireCompanyId } from '../utils/request.util.js';

export const createFeeForStudent =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const { feeAccount } = await createFeeAccount(companyId, req.body);

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
            const feeAccountId = req.params.id;

            const { feeAccount } = await getFeeAccount(companyId, feeAccountId);

            return res.status(200).send({
                message: "Fee account retrieved successfully",
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
            const query = res.locals.query as PaginationQuery;
            const { skip, take, search, orderBy } = parseQuery(query);

            const { feeAccounts, total } = await getFeeAccounts(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).send({
                message: "Fee accounts retrieved successfully",
                feeAccounts, total,
            });

        } catch (err) {
            logError("Failed to get fee accounts", err);
            return next(err);
        }
    }