import { FeeAccountDto } from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { DiscountType, FeeAccount, PaymentStatus, Prisma } from "@prisma/client";
import {
    FeeAccountResponseDto,
    FeeAccountsResponseDto
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { verifyStudent } from "./student.service.js";
import { verifyCourse } from "./course.service.js";

export const createFeeAccount =
    async (companyId: string, data: FeeAccountDto):
        Promise<{
            feeAccount: FeeAccountResponseDto["feeAccount"];
        }> => {

        const { studentId, discountType, discountValue, discountNote, paymentStatus, paymentPlan} = data;

        // verify student
        const student = await verifyStudent(studentId, companyId);

        const existsFeeAccount = await prisma.feeAccount.findUnique({
            where: { studentId }
        });

        if (existsFeeAccount) {
            throw new AppError("Fee account already exists", 409, "FEE_ACCOUNT_ALREADY_EXISTS");
        }

        // verify course
        const course = await verifyCourse(student.courseId, companyId);

        const totalFee = course.price;

        let finalFee = totalFee;

        if (discountType === DiscountType.PERCENT) {
            const discountAmount = totalFee.mul(discountValue).div(100);
            finalFee = totalFee.sub(discountAmount);
        }

        if (discountType === DiscountType.FIXED) {
            finalFee = totalFee.sub(discountValue);
        }

        const feeAccount = await prisma.feeAccount.create({
            data: {
                companyId,
                studentId,
                totalFee: new Prisma.Decimal(totalFee),
                discountType,
                discountValue: new Prisma.Decimal(discountValue),
                discountNote,
                finalFee: new Prisma.Decimal(finalFee),
                paid: new Prisma.Decimal(0),
                remainingAmount: new Prisma.Decimal(finalFee),
                paymentPlan,
                paymentStatus
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:feeaccounts:*`);

        return {
            feeAccount: mapFeeAccount(feeAccount)
        };

    }

export const getFeeAccount =
    async (companyId: string, feeAccountId: string):
        Promise<{
            feeAccount: FeeAccountResponseDto["feeAccount"];
        }> => {

        const feeAccount = await prisma.feeAccount.findFirst({
            where: { id: feeAccountId, companyId }
        });

        if (!feeAccount) {
            throw new AppError("Fee account not found", 404, "FEE_ACCOUNT_NOT_FOUND");
        }

        return {
            feeAccount: mapFeeAccount(feeAccount)
        };
    }

export const getFeeAccounts =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        feeAccounts: FeeAccountsResponseDto["feeAccounts"];
        total: number
    }> => {

        const key = `company:${companyId}:feeaccounts:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.FeeAccountWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { paymentStatus: { equals: search as PaymentStatus } },
                ]
            })
        }

        const [feeAccountsData, total] = await Promise.all([
            prisma.feeAccount.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    studentId: true,
                    companyId: true,
                    totalFee: true,
                    discountType: true,
                    discountValue: true,
                    discountNote: true,
                    finalFee: true,
                    paid: true,
                    remainingAmount: true,
                    paymentPlan: true,
                    paymentStatus: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.feeAccount.count({ where })
        ]);

        if (feeAccountsData.length === 0) {
            return { feeAccounts: [], total: 0 }
        }

        const feeAccounts = feeAccountsData.map(feeAccount =>
            mapFeeAccount(feeAccount)
        );

        // set to redis
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ feeAccounts, total })
        );

        return {
            feeAccounts,
            total
        };

    }

export function mapFeeAccount(feeAccount: FeeAccount) {
    return {
        id: feeAccount.id,
        studentId: feeAccount.studentId,
        companyId: feeAccount.companyId,
        totalFee: feeAccount.totalFee.toString(),
        discountType: feeAccount.discountType,
        discountValue: feeAccount.discountValue.toString(),
        discountNote: feeAccount.discountNote,
        finalFee: feeAccount.finalFee.toString(),
        paid: feeAccount.paid.toString(),
        remainingAmount: feeAccount.remainingAmount.toString(),
        paymentPlan: feeAccount.paymentPlan,
        paymentStatus: feeAccount.paymentStatus,
        createdAt: feeAccount.createdAt,
        updatedAt: feeAccount.updatedAt
    }
}