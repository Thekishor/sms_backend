import {
    PaymentMethod,
    Prisma,
    PaymentStatus,
    SubscriptionType,
    SubscriptionPaymentStatus,
    SubscriptionStatus,
    SubscriptionPayment
} from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { SubscriptionPaymentDto } from "../schemas/request/request.dto.js";
import AppError from "../utils/AppError.js";
import {
    SubscriptionPaymentResponseDto,
    SubscriptionPaymentsResponseDto
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";

export const subscriptionPaymentService =
    async (
        subscriptionId: string,
        superAdminId: string,
        data: SubscriptionPaymentDto
    ): Promise<{
        subscriptionPayment: SubscriptionPaymentResponseDto["subscriptionPayment"]
    }> => {

        const { amount, paymentMethod, referenceNumber, remarks } = data;

        const subscription = await prisma.subscription.findFirst({
            where: {
                id: subscriptionId,
                status: SubscriptionStatus.ACTIVE
            }
        });

        if (!subscription) {
            throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
        }

        if (subscription.type === SubscriptionType.TRIAL) {
            throw new AppError(
                "Trial subscriptions cannot accept payments.",
                400,
                "TRIAL_SUBSCRIPTIONS_CANNOT_BE_PAID"
            );
        }

        if (subscription.paymentStatus === SubscriptionPaymentStatus.PAID) {
            throw new AppError("Subscription is already paid", 400, "SUBSCRIPTION_ALREADY_PAID");
        }

        const paymentMethods: PaymentMethod[] = [
            PaymentMethod.BANK_TRANSFER,
            PaymentMethod.CASH,
            PaymentMethod.CHEQUE,
            PaymentMethod.QR,
            PaymentMethod.OTHER
        ];

        if (!paymentMethods.includes(paymentMethod)) {
            throw new AppError("Invalid payment method", 400, "INVALID_PAYMENT_METHOD");
        }

        const paymentAmount = new Prisma.Decimal(amount);

        const remainingBalance = subscription.amount.minus(subscription.amountPaid);

        if (paymentAmount.gt(remainingBalance)) {
            throw new AppError(
                "Payment amount cannot exceed the remaining balance.",
                400,
                "PAYMENT_AMOUNT_EXCEEDS_REMAINING_BALANCE"
            );
        }

        const paymentStatus: PaymentStatus =
            paymentAmount.eq(remainingBalance)
                ? PaymentStatus.PAID
                : PaymentStatus.PARTIAL;

        return await prisma.$transaction(async (tx) => {

            const subscriptionPayment = await tx.subscriptionPayment.create({
                data: {
                    subscriptionId,
                    amount: paymentAmount,
                    paymentMethod,
                    referenceNumber,
                    paymentDate: new Date(),
                    status: paymentStatus,
                    verifiedById: superAdminId,
                    remarks
                }
            });

            // Accumulate: total paid so far + this payment
            const newAmountPaid = subscription.amountPaid.plus(paymentAmount);
            const remainingAmount = subscription.amount.minus(subscription.amountPaid);

            let subscriptionPaymentStatus: SubscriptionPaymentStatus;

            if (paymentAmount.eq(remainingAmount)) {
                subscriptionPaymentStatus = SubscriptionPaymentStatus.PAID;
            } else if (paymentAmount.lt(remainingAmount)) {
                subscriptionPaymentStatus = SubscriptionPaymentStatus.PARTIALLY_PAID;
            } else {
                throw new AppError(
                    "Payment amount cannot exceed the remaining balance.",
                    400,
                    "PAYMENT_AMOUNT_EXCEEDS_REMAINING_BALANCE"
                );
            }

            await tx.subscription.update({
                where: {
                    id: subscriptionId,
                },
                data: {
                    amountPaid: newAmountPaid,
                    paymentStatus: subscriptionPaymentStatus
                }
            });

            // del from redis
            await redisOperation.del(`company:subscription:*:payments:*`);
            await redisOperation.del(`subscription:payments:*`);

            return {
                subscriptionPayment: mapSubscriptionPayment(subscriptionPayment)
            };
        })

    }

export const getSubscriptionPaymentsService =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
        subscriptionId: string
    ): Promise<{
        subscriptionPayments: SubscriptionPaymentsResponseDto["subscriptionPayments"];
        total: number;
    }> => {

        const key = `company:subscription:${subscriptionId}:payments:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SubscriptionPaymentWhereInput = {
            subscriptionId,
            ...(search && {
                subscription: {
                    company: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    }
                }
            })
        }

        const [rawSubscriptionPayments, total] = await Promise.all([
            prisma.subscriptionPayment.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    subscriptionId: true,
                    amount: true,
                    paymentMethod: true,
                    referenceNumber: true,
                    paymentDate: true,
                    status: true,
                    verifiedById: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.subscriptionPayment.count({ where })
        ]);

        if (rawSubscriptionPayments.length === 0) {
            return { subscriptionPayments: [], total: 0 }
        }

        const subscriptionPayments = rawSubscriptionPayments.map(subscriptionPayment => ({
            ...subscriptionPayment,
            amount: subscriptionPayment.amount.toString(),
            verifiedBy: subscriptionPayment.verifiedById
        }));

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ subscriptionPayments, total })
        )

        return {
            subscriptionPayments,
            total
        }
    }

export const getSubscriptionPaymentService =
    async (
        subscriptionPaymentId: string
    ): Promise<{
        subscriptionPayment: SubscriptionPaymentResponseDto["subscriptionPayment"]
    }> => {

        const subscriptionPayment = await prisma.subscriptionPayment.findUnique({
            where: {
                id: subscriptionPaymentId
            }
        });

        if (!subscriptionPayment) {
            throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
        }

        return {
            subscriptionPayment: mapSubscriptionPayment(subscriptionPayment)
        }
    }

export const getAllSubscriptionPaymentsService =
    async (
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
    ): Promise<{
        subscriptionPayments: SubscriptionPaymentsResponseDto["subscriptionPayments"];
        total: number;
    }> => {

        const key = `subscription:payments:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;

        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.SubscriptionPaymentWhereInput = {
            ...(search && {
                subscription: {
                    company: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    }
                }
            })
        }

        const [rawSubscriptionPayments, total] = await Promise.all([
            prisma.subscriptionPayment.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    subscriptionId: true,
                    amount: true,
                    paymentMethod: true,
                    referenceNumber: true,
                    paymentDate: true,
                    status: true,
                    verifiedById: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.subscriptionPayment.count({ where })
        ]);

        if (rawSubscriptionPayments.length === 0) {
            return { subscriptionPayments: [], total: 0 }
        }

        const subscriptionPayments = rawSubscriptionPayments.map(subscriptionPayment => ({
            ...subscriptionPayment,
            amount: subscriptionPayment.amount.toString(),
            verifiedBy: subscriptionPayment.verifiedById
        }));

        // set to redis 
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ subscriptionPayments, total })
        )

        return {
            subscriptionPayments,
            total
        }
    }

export function mapSubscriptionPayment(subscriptionPayment: SubscriptionPayment) {
    return {
        id: subscriptionPayment.id,
        subscriptionId: subscriptionPayment.subscriptionId,
        amount: subscriptionPayment.amount.toString(),
        paymentMethod: subscriptionPayment.paymentMethod,
        referenceNumber: subscriptionPayment.referenceNumber,
        paymentDate: subscriptionPayment.paymentDate,
        status: subscriptionPayment.status,
        verifiedBy: subscriptionPayment.verifiedById,
        createdAt: subscriptionPayment.createdAt,
        updatedAt: subscriptionPayment.updatedAt
    };
}