import { NextFunction, Request, Response } from 'express';
import { logError } from "../config/logger.js";
import AppError from '../utils/AppError.js';
import { prisma } from '../config/prisma.js';
import { SubscriptionStatus } from '@prisma/client';

export const requireSubscription =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = req.companyId;
            const now = new Date();

            const subscription = await prisma.subscription.findFirst({
                where: {
                    companyId,
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

            if (!subscription) {
                throw new AppError(
                    "A subscription is required to access this feature",
                    403,
                    "SUBSCRIPTION_REQUIRED"
                );
            }

            if (subscription.status !== SubscriptionStatus.ACTIVE) {
                throw new AppError(
                    `Your ${subscription.type.toLowerCase()} subscription is ${subscription.status.toLowerCase()}`,
                    403,
                    `${subscription.type}_SUBSCRIPTION_${subscription.status}`
                );
            }

            if (subscription.startDate > now) {
                throw new AppError(
                    "Your subscription has not started yet",
                    403,
                    "SUBSCRIPTION_NOT_STARTED"
                );
            }

            if (subscription.endDate < now) {
                throw new AppError(
                    `Your ${subscription.type.toLowerCase()} subscription has expired`,
                    403,
                    `${subscription.type}_SUBSCRIPTION_EXPIRED`
                );
            }

            return next();

        } catch (error) {
            logError("Failed to verify company subscription", error);
            return next(error);
        }
    }