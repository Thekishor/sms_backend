import {
    Prisma, Subscription,
    SubscriptionPaymentStatus, SubscriptionStatus, SubscriptionType,
    Status
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { SubscriptionDto } from "../schemas/request/request.dto.js";
import AppError from "../utils/AppError.js";
import { SubscriptionResponseDto, SubscriptionsResponseDto } from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { sendEmailToCompany } from "../jobs/cron/subscription-reminder.job.js";

export const companySubscription =
    async (data: SubscriptionDto, companyId: string):
        Promise<{
            subscription: SubscriptionResponseDto["subscription"]
        }> => {

        const { type, startDate, endDate, amount, remarks } = data;

        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                companyId,
                status: SubscriptionStatus.ACTIVE
            }
        });

        if (activeSubscription) {
            throw new AppError(
                "Company already has an active subscription.",
                400,
                "ACTIVE_SUBSCRIPTION_EXISTS"
            );
        }

        const subscriptionType: SubscriptionType[] = [SubscriptionType.PAID, SubscriptionType.TRIAL];

        if (!subscriptionType.includes(type)) {
            throw new AppError(
                "Invalid subscription type.",
                400,
                "INVALID_SUBSCRIPTION_TYPE"
            );
        };

        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (duration <= 0) {
            throw new AppError(
                "Invalid date range. End date must be greater than start date.",
                400,
                "INVALID_DATE_RANGE"
            );
        }

        let subscriptionPaymentStatus: SubscriptionPaymentStatus;
        let rawAmount;

        if (type === SubscriptionType.TRIAL) {
            subscriptionPaymentStatus = SubscriptionPaymentStatus.NOT_APPLICABLE;
            rawAmount = 0;
        } else {
            if (amount <= 0) {
                throw new AppError(
                    "Payment amount must be greater than 0",
                    400,
                    "INVALID_PAYMENT_AMOUNT"
                );
            }

            subscriptionPaymentStatus = SubscriptionPaymentStatus.UNPAID
            rawAmount = amount;
        }

        const subscription = await prisma.subscription.create({
            data: {
                companyId,
                type,
                duration,
                startDate,
                endDate,
                amount: new Prisma.Decimal(rawAmount),
                paymentStatus: subscriptionPaymentStatus,
                remarks
            }
        });

        // delete from redis
        await redisOperation.del(`company:*:subscriptions:*`);
        await redisOperation.del(`superadmin:*:subscriptions:*`);

        return {
            subscription: mapSubscription(subscription)
        }
    }

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

/**
 * Admin cancels their own trial subscription.
 * Only TRIAL subscriptions that are ACTIVE can be cancelled by the admin.
 */
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

/**
 * Admin pays their subscription.
 * This is a mock payment that directly activates the subscription and company.
 */
export const payCompanySubscriptionService =
    async (companyId: string) => {
        // Find the latest subscription for this company (it might be expired or cancelled trial)
        const subscription = await prisma.subscription.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        if (!subscription) {
            throw new AppError(
                "No subscription found for this company",
                404,
                "SUBSCRIPTION_NOT_FOUND"
            );
        }

        const subStart = new Date();
        const subEnd = new Date(subStart);
        subEnd.setDate(subEnd.getDate() + 365); // 1 year paid

        // 1. Update Subscription
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                type: SubscriptionType.PAID,
                status: SubscriptionStatus.ACTIVE,
                paymentStatus: SubscriptionPaymentStatus.PAID,
                startDate: subStart,
                endDate: subEnd,
                duration: 365,
                amountPaid: subscription.amount // Assuming they paid full amount
            }
        });

        // 2. Update Company Status to ACTIVE
        await prisma.company.update({
            where: { id: companyId },
            data: { status: Status.ACTIVE }
        });

        // 3. Create a mock payment record for history (optional but good practice)
        await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount: subscription.amount,
                paymentMethod: 'OTHER',
                referenceNumber: 'MOCK_PAYMENT_' + Date.now(),
                paymentDate: new Date(),
                status: 'PAID',
                verifiedById: subscription.companyId, // Just a placeholder for mock
                remarks: "Paid by Admin (Mock)"
            }
        });

        await redisOperation.del(`company:${companyId}:subscriptions:*`);
        await redisOperation.del(`superadmin:*:subscriptions:*`);

        return { subscription: mapSubscription(updatedSubscription) };
    }

/**
 * Superadmin changes the subscription type of a company.
 * It cancels the old subscription and creates a fresh one with the requested type.
 */
export const changeCompanySubscriptionTypeService =
    async (superAdminId: string, companyId: string, newType: SubscriptionType) => {
        // Find existing subscription
        const existingSub = await prisma.subscription.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        if (existingSub) {
            // Cancel the existing one
            await prisma.subscription.update({
                where: { id: existingSub.id },
                data: { status: SubscriptionStatus.CANCELLED }
            });
        }

        const duration = newType === SubscriptionType.TRIAL ? 14 : 365;
        const subStart = new Date();
        const subEnd = new Date(subStart);
        subEnd.setDate(subEnd.getDate() + duration);

        const newSub = await prisma.subscription.create({
            data: {
                companyId,
                type: newType,
                duration,
                startDate: subStart,
                endDate: subEnd,
                amount: newType === SubscriptionType.TRIAL ? 0 : 1000, // Mock amount for paid
                status: SubscriptionStatus.ACTIVE,
                paymentStatus: newType === SubscriptionType.TRIAL ? SubscriptionPaymentStatus.NOT_APPLICABLE : SubscriptionPaymentStatus.PAID
            }
        });

        // Activate company if not active
        await prisma.company.update({
            where: { id: companyId },
            data: { status: Status.ACTIVE }
        });

        if (newType === SubscriptionType.PAID) {
            // Create mock payment record
            await prisma.subscriptionPayment.create({
                data: {
                    subscriptionId: newSub.id,
                    amount: newSub.amount,
                    paymentMethod: 'OTHER',
                    referenceNumber: 'SA_MOCK_PAYMENT_' + Date.now(),
                    paymentDate: new Date(),
                    status: 'PAID',
                    verifiedById: superAdminId,
                    remarks: "Changed to PAID by Superadmin"
                }
            });
        }

        await redisOperation.del(`company:${companyId}:subscriptions:*`);
        await redisOperation.del(`superadmin:*:subscriptions:*`);

        return { subscription: mapSubscription(newSub) };
    }
