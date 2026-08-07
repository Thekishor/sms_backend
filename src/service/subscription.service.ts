import {
    Prisma, Subscription, SubscriptionStatus, SubscriptionType
} from "@prisma/client";
import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";
import { SubscriptionResponseDto, SubscriptionsResponseDto } from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { sendEmailToCompany } from "../jobs/cron/subscription-reminder.job.js";

export const getCompanySubscriptionsService =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
        companyId: string
    ): Promise<{
        subscriptions: SubscriptionsResponseDto["subscriptions"];
        total: number;
    }> => {

        const key = `company:${companyId}:subscriptions:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SubscriptionWhereInput = {
            companyId,
            ...(search && {
                company: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            }),
        }

        const [rawSubscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    companyId: true,
                    type: true,
                    duration: true,
                    startDate: true,
                    endDate: true,
                    amount: true,
                    status: true,
                    paymentStatus: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.subscription.count({ where })
        ])

        if (rawSubscriptions.length === 0) {
            return { subscriptions: [], total: 0 }
        };

        const subscriptions = rawSubscriptions.map(subscription => ({
            ...subscription,
            amount: subscription.amount.toString(),
        }));

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ subscriptions, total })
        )

        return {
            subscriptions, total
        }
    }

export const getActiveSubscriptions =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
        companyId: string
    ): Promise<{
        subscriptions: SubscriptionsResponseDto["subscriptions"];
        total: number;
    }> => {

        const key = `company:${companyId}:subscriptions:active:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SubscriptionWhereInput = {
            companyId,
            status: SubscriptionStatus.ACTIVE,
            ...(search && {
                company: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            }),
        };

        const [rawSubscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                select: {
                    id: true,
                    companyId: true,
                    type: true,
                    duration: true,
                    startDate: true,
                    endDate: true,
                    amount: true,
                    status: true,
                    paymentStatus: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.subscription.count({ where })
        ]);

        if (rawSubscriptions.length === 0) {
            return { subscriptions: [], total: 0 }
        }

        const subscriptions = rawSubscriptions.map(subscription => ({
            ...subscription,
            amount: subscription.amount.toString(),
        }));

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ subscriptions, total })
        )

        return {
            subscriptions, total
        }
    }

export const getAllSubscriptionsService =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
        superAdminId: string
    ): Promise<{
        subscriptions: SubscriptionsResponseDto["subscriptions"];
        total: number
    }> => {

        const key = `superadmin:${superAdminId}:subscriptions:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SubscriptionWhereInput = {
            ...(search && {
                company: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            }),
        };

        const [rawSubscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    companyId: true,
                    type: true,
                    duration: true,
                    startDate: true,
                    endDate: true,
                    amount: true,
                    status: true,
                    paymentStatus: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.subscription.count({ where })
        ]);

        if (rawSubscriptions.length === 0) {
            return { subscriptions: [], total: 0 }
        };

        const subscriptions = rawSubscriptions.map(subscription => ({
            ...subscription,
            amount: subscription.amount.toString(),
        }));

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ subscriptions, total })
        )

        return {
            subscriptions, total
        }
    }

export const updateSubscriptionService =
    async (superAdminId: string, subscriptionId: string):
        Promise<{
            subscription: SubscriptionResponseDto["subscription"]
        }> => {

        const existsSubscription = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            }
        });

        if (!existsSubscription) {
            throw new AppError(
                "Subscription not found for this company",
                404,
                "SUBSCRIPTION_NOT_FOUND"
            );
        }

        const subscription = existsSubscription.status === SubscriptionStatus.CANCELLED
            ? existsSubscription
            : await prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: SubscriptionStatus.CANCELLED
                }
            });

        // delete from redis
        await redisOperation.del(`company:*:subscriptions:*`);
        await redisOperation.del(`superadmin:*:subscriptions:*`);

        return {
            subscription: mapSubscription(subscription)
        };
    }

export const reminderMailForCompany =
    async (subscriptionId: string) => {

        const now = new Date();

        const subscription = await prisma.subscription.findFirst({
            where: {
                id: subscriptionId,
            },
            include: {
                company: true
            }
        });

        if (!subscription) {
            throw new AppError(
                "Subscription not found for this company",
                404,
                "SUBSCRIPTION_NOT_FOUND"
            );
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new AppError(
                `${subscription.type.toLowerCase()} subscription is ${subscription.status.toLowerCase()}`,
                403,
                `${subscription.type}_SUBSCRIPTION_${subscription.status}`
            );
        }

        if (subscription.startDate > now) {
            throw new AppError(
                "Subscription has not started yet",
                403,
                "SUBSCRIPTION_NOT_STARTED"
            );
        }

        if (subscription.endDate < now) {
            throw new AppError(
                `${subscription.type.toLowerCase()} subscription has expired`,
                403,
                `${subscription.type}_SUBSCRIPTION_EXPIRED`
            );
        }

        //days remaining calculate
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        const daysRemaining = Math.ceil(
            (subscription.endDate.getTime() - Date.now()) / ONE_DAY_MS
        );

        const expiryDate = subscription.endDate
            .toLocaleString("en-GB", {
                timeZone: "Asia/Kathmandu",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })
            .replace("am", "AM")
            .replace("pm", "PM");

        await sendEmailToCompany(
            subscription.company.email,
            subscription.company.name,
            subscription.type,
            expiryDate,
            daysRemaining
        );
    }


export function mapSubscription(subscription: Subscription) {
    return {
        id: subscription.id,
        companyId: subscription.companyId,
        type: subscription.type,
        duration: subscription.duration,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: subscription.amount.toString(),
        status: subscription.status,
        paymentStatus: subscription.paymentStatus,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
    }
}

export const getCompanyActiveSubscriptionService =
    async (companyId: string): Promise<{
        subscription: SubscriptionResponseDto["subscription"] | null
    }> => {

        const subscription = await prisma.subscription.findFirst({
            where: { companyId },
            orderBy: { createdAt: "desc" }
        });

        return {
            subscription: subscription ? mapSubscription(subscription) : null
        };
    }

export const cancelTrialSubscriptionService =
    async (companyId: string): Promise<{
        subscription: SubscriptionResponseDto["subscription"]
    }> => {

        const subscription = await prisma.subscription.findFirst({
            where: {
                companyId,
                type: SubscriptionType.TRIAL,
                status: SubscriptionStatus.ACTIVE,
            }
        });

        if (!subscription) {
            throw new AppError(
                "No active trial subscription found for this company",
                404,
                "TRIAL_SUBSCRIPTION_NOT_FOUND"
            );
        }

        const cancelledSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.CANCELLED }
        });

        await redisOperation.del(`company:${companyId}:subscriptions:*`);
        await redisOperation.del(`superadmin:*:subscriptions:*`);

        return { subscription: mapSubscription(cancelledSubscription) };
    }