import { NextFunction, Request, Response } from 'express';
import { logError } from '../config/logger.js';
import AppError from '../utils/AppError.js';
import { prisma } from '../config/database.js';
import { Status } from '@prisma/client';

export const requireCompany =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // staff
            if (req.staff) {

                const companyId = req.staff.companyId;

                if (!companyId) {
                    throw new AppError("Company Id is required", 400, "COMPANY_ID_REQUIRED");
                }

                const company = await prisma.company.findUnique({
                    where: { id: companyId }
                });

                if (!company) {
                    throw new AppError(
                        "Company not found",
                        404,
                        "COMPANY_NOT_FOUND"
                    );
                }

                if (company.status !== Status.ACTIVE) {
                    throw new AppError(
                        `Access denied. Company account is ${company.status.toLowerCase()}`,
                        403,
                        `COMPANY_${company.status}`
                    );
                }

                req.companyId = companyId;
                return next();
            }

            // admin
            else if (req.admin) {

                const rawCompanyId = req.headers["x-company-id"];

                if (typeof rawCompanyId !== "string" || rawCompanyId.trim().length === 0) {
                    throw new AppError("Company Id is required", 400, "COMPANY_ID_REQUIRED");
                }

                const companyId = rawCompanyId.trim();

                const company = await prisma.company.findFirst({
                    where: {
                        id: companyId,
                        createdBy: req.admin.id,
                    }
                });

                if (!company) {
                    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
                }

                if (company.status !== Status.ACTIVE) {
                    throw new AppError(
                        `Access denied. Company account is ${company.status.toLowerCase()}`,
                        403,
                        `COMPANY_${company.status}`
                    );
                }

                req.companyId = companyId;

                return next();

            } else {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

        } catch (error) {
            logError("Failed to verify company", error);
            return next(error);
        }
    }