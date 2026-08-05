import { PaymentDto } from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { Payment, PaymentStatus, Prisma } from "@prisma/client";
import {
    PaymentResponseDto,
    PaymentsResponseDto
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { verifyStudent } from "./student.service.js";

export const createPayment =
    async (companyId: string, data: PaymentDto):
        Promise<{
            payment: PaymentResponseDto["payment"];
        }> => {

        const { studentId, amount, date, description } = data;

        // verify student
        await verifyStudent(studentId, companyId);

        const feeAccount = await prisma.feeAccount.findFirst({
            where: { studentId, companyId },
        })

        if (!feeAccount) {
            throw new AppError("Student not found with fee account", 404, "FEE_ACCOUNT_NOT_FOUND");
        }

        if (feeAccount.paymentStatus === PaymentStatus.PAID) {
            throw new AppError("Student has already paid all fees", 400, "STUDENT_ALREADY_PAID");
        }

        const paymentAmount = new Prisma.Decimal(amount);

        if (paymentAmount.gt(feeAccount.remainingAmount)) {
            throw new AppError("Payment amount exceeds remaining fee", 400, "PAYMENT_AMOUNT_EXCEEDS");
        }

        return await prisma.$transaction(async (tx) => {

            const payment = await tx.payment.create({
                data: {
                    studentId,
                    companyId,
                    amount: paymentAmount,
                    date,
                    description,
                }
            });

            // del from redis
            await redisOperation.del(`company:${companyId}:payments:*`);

            const newPaid = feeAccount.paid.plus(paymentAmount);
            const remainingAmount = feeAccount.finalFee.minus(newPaid);

            let paymentStatus: PaymentStatus;

            if (remainingAmount.eq(0)) {
                paymentStatus = PaymentStatus.PAID;
            } else if (newPaid.gt(0)) {
                paymentStatus = PaymentStatus.PARTIAL;
            } else {
                paymentStatus = PaymentStatus.PENDING;
            }

            await prisma.feeAccount.update({
                where: { studentId },
                data: {
                    paid: newPaid,
                    remainingAmount,
                    paymentStatus: paymentStatus,
                }
            });

            return {
                payment: mapPayment(payment)
            };
        });

    }

export const getPayment =
    async (companyId: string, paymentId: string):
        Promise<{
            payment: PaymentResponseDto["payment"];
        }> => {

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, companyId },
        });

        if (!payment) {
            throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
        }

        return {
            payment: mapPayment(payment)
        };
    }

export const getPayments =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        payments: PaymentsResponseDto["payments"];
        total: number;
    }> => {

        const key = `company:${companyId}:payments:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.PaymentWhereInput = {
            companyId
        }

        const [paymentsData, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    amount: true,
                    date: true,
                    description: true,
                    studentId: true,
                    companyId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.payment.count({ where })
        ]);

        if (paymentsData.length === 0) {
            return { payments: [], total: 0 }
        }

        const payments = paymentsData.map(payment => mapPayment(payment));

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ payments, total }));

        return { payments, total };
    }

export function mapPayment(payment: Payment) {
    return {
        id: payment.id,
        amount: payment.amount.toString(),
        date: payment.date,
        description: payment.description,
        studentId: payment.studentId,
        companyId: payment.companyId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
    }
}