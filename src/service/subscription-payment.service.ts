import {
    PaymentMethod,
    Prisma,
    PaymentStatus,
    SubscriptionType,
    SubscriptionPaymentStatus,
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

        const { amount, paymentMethod, referenceNumber, remarks, month } = data;
        let startDate: Date = new Date();
        let newEndDate: Date;

        const subscription = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            }
        });

        if (!subscription) {
            throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
        }

        if (subscription.endDate >= new Date()) {
            newEndDate = new Date(subscription.endDate);
        } else {
            newEndDate = new Date(startDate);
        }

        newEndDate.setMonth(newEndDate.getMonth() + month);

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

        let duration = Math.ceil((startDate.getTime() - newEndDate.getTime()) / (1000 * 60 * 60 * 24));

        return await prisma.$transaction(async (tx) => {

            const subscriptionPayment = await tx.subscriptionPayment.create({
                data: {
                    subscriptionId,
                    amount: paymentAmount,
                    paymentMethod,
                    referenceNumber,
                    paymentDate: new Date(),
                    status: PaymentStatus.PAID,
                    verifiedBy: superAdminId,
                    remarks
                }
            });

            await tx.subscription.update({
                where: {
                    id: subscriptionId,
                },
                data: {
                    type: SubscriptionType.PAID,
                    startDate: startDate,
                    endDate: newEndDate,
                    duration,
                    amountPaid: paymentAmount,
                    paymentStatus: SubscriptionPaymentStatus.PAID
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

export const getSubscriptionPaymentByIdService =
    async (subscriptionId: string):
        Promise<{
            subscriptionPayment: SubscriptionPaymentResponseDto["subscriptionPayment"]
        }> => {

        const subscription = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            }
        });

        if (!subscription) {
            throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
        }

        const subscriptionPayment = await prisma.subscriptionPayment.findFirst({
            where: { subscriptionId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                subscriptionId: true,
                amount: true,
                paymentMethod: true,
                referenceNumber: true,
                paymentDate: true,
                status: true,
                verifiedBy: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!subscriptionPayment) {
            throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
        }

        return {
            subscriptionPayment: {
                ...subscriptionPayment,
                verifiedBy: subscriptionPayment?.verifiedBy?.toString(),
                amount: subscriptionPayment?.amount.toString()
            }
        }
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

export const getSubscriptionByPaymentService =
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
                    verifiedBy: true,
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
            verifiedBy: subscriptionPayment.verifiedBy
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
        verifiedBy: subscriptionPayment.verifiedBy,
        createdAt: subscriptionPayment.createdAt,
        updatedAt: subscriptionPayment.updatedAt
    };
}