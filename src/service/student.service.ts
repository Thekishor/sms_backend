import { StudentDto, StudentUpdateDto } from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { Prisma, Status } from "@prisma/client";
import {
    StudentResponseDto,
    StudentsResponseDto,
    StudentsWithPaymentsResponseDto,
    StudentWithFeeAccountResponseDto,
    StudentWithPaymentsResponseDto,
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";
import { Student } from "@prisma/client/edge";
import { mapFeeAccount } from "./fee-account.service.js";
import { mapPayment } from "./payment.service.js";
import { verifyBatch } from "./batch.service.js";
import { verifyCourse } from "./course.service.js";

export const createStudentService =
    async (data: StudentDto, companyId: string):
        Promise<{
            student: StudentResponseDto["student"];
        }> => {

        const {
            fullName, email, phone, address, joiningDate,
            guardianName, guardianPhone, batchId, courseId
        } = data;

        const existsStudent = await prisma.student.findFirst({
            where: {
                companyId,
                OR: [{ email }, { phone }]
            }
        });

        if (existsStudent) {

            if (existsStudent.email === email && existsStudent.status === Status.ACTIVE) {
                throw new AppError(
                    "Student already exists with this email",
                    409,
                    "STUDENT_ALREADY_EXISTS"
                );
            }

            if (existsStudent.phone === phone && existsStudent.status === Status.ACTIVE) {
                throw new AppError(
                    "Student already exists with this phone number",
                    409,
                    "STUDENT_ALREADY_EXISTS"
                );
            }

            // Account exists but is inactive/pending/rejected
            throw new AppError(
                STATUS_ERROR[existsStudent.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            )
        }

        // verify batch
        await verifyBatch(batchId, companyId);

        // verify course
        await verifyCourse(courseId, companyId);

        const student = await prisma.student.create({
            data: {
                fullName,
                email,
                phone,
                address,
                joiningDate,
                guardianName,
                guardianPhone,
                batchId,
                courseId,
                companyId,
            }
        })

        // del from redis
        await redisOperation.del(`company:${companyId}:students:*`);

        return {
            student: mapStudent(student)
        };
    }

export const getStudents =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        students: StudentsResponseDto["students"];
        total: number;
    }> => {

        const key = `company:${companyId}:students:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.StudentWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } }
                ]
            })
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    address: true,
                    guardianName: true,
                    guardianPhone: true,
                    joiningDate: true,
                    companyId: true,
                    status: true,
                    batchId: true,
                    courseId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.student.count({ where })
        ]);

        if (students.length === 0) {
            return { students: [], total: 0 }
        }

        // set to redis
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ students, total })
        );

        return { students, total };
    }

export const getStudent =
    async (companyId: string, studentId: string): Promise<{
        student: StudentResponseDto["student"];
    }> => {

        const student = await verifyStudent(studentId, companyId);

        return {
            student: mapStudent(student)
        };
    }

export const getStudentsWithPayments =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">,
    ): Promise<{
        students: StudentsWithPaymentsResponseDto["students"];
        total: number;
    }> => {

        const key = `company:${companyId}:students:payments:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.StudentWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } }
                ]
            })
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    address: true,
                    guardianName: true,
                    guardianPhone: true,
                    joiningDate: true,
                    status: true,
                    batchId: true,
                    courseId: true,
                    createdAt: true,
                    updatedAt: true,
                    companyId: true,
                    payments: {
                        select: {
                            id: true,
                            amount: true,
                            date: true,
                            description: true,
                            studentId: true,
                            createdAt: true,
                            updatedAt: true,
                            companyId: true
                        }
                    }
                }
            }),
            prisma.student.count({ where })
        ]);

        if (students.length === 0) {
            return { students: [], total: 0 };
        }

        const studentData = students.map(student => ({
            ...mapStudent(student),
            payments: student.payments.map(payment => mapPayment(payment))
        }));

        // set to redis
        await redisOperation.setEx(
            key,
            600,
            JSON.stringify({ students, total })
        );

        return { students: studentData, total };
    }

export const getStudentPayments =
    async (companyId: string, studentId: string):
        Promise<{
            student: StudentWithPaymentsResponseDto["student"];
        }> => {

        const student = await prisma.student.findFirst({
            where: { id: studentId, companyId },
            include: {
                payments: true
            }
        });

        if (!student) {
            throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
        }

        const { payments } = student;
        const studentData = mapStudent(student);

        return {
            student: {
                ...studentData,
                payments: payments.map(payment => mapPayment(payment))
            }
        }
    }

export const getFeeAccountService =
    async (companyId: string, studentId: string):
        Promise<{
            student: StudentWithFeeAccountResponseDto["student"];
        }> => {

        const student = await prisma.student.findFirst({
            where: { id: studentId, companyId },
            include: {
                feeAccount: true
            }
        });

        if (!student) {
            throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
        }

        const { feeAccount } = student;
        const mapStudentInfo = mapStudent(student);

        return {
            student: {
                ...mapStudentInfo,
                feeAccount: feeAccount ? mapFeeAccount(feeAccount) : null
            }
        }

    }

export const updateStudent =
    async (studentId: string, data: StudentUpdateDto, companyId: string):
        Promise<{
            student: StudentResponseDto["student"];
        }> => {

        const { fullName, email, phone, address, guardianName, guardianPhone } = data;

        const student = await verifyStudent(studentId, companyId);

        const updatedStudent = await prisma.student.update({
            where: { id: student.id },
            data: {
                fullName,
                email,
                phone,
                address,
                guardianName,
                guardianPhone,
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:students:*`);

        return {
            student: mapStudent(updatedStudent)
        };
    }

export const changedStatus =
    async (companyId: string, studentId: string, status: Status) => {

        const studentStatus: Status[] = [Status.ACTIVE, Status.INACTIVE, Status.PENDING];

        if (!studentStatus.includes(status)) {
            throw new AppError("Invalid status value", 400, "INVALID_STATUS");
        }

        const student = await verifyStudent(studentId, companyId);

        const updatedStudent = await prisma.student.update({
            where: { id: student.id },
            data: { status }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:students:*`);

        return {
            student: mapStudent(updatedStudent)
        };
    }

export const deleteStudent =
    async (studentId: string, companyId: string) => {

        const student = await verifyStudent(studentId, companyId);

        await prisma.student.delete({
            where: { id: student.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:students:*`);
    }

export async function verifyStudent(studentId: string, companyId: string) {

    const student = await prisma.student.findFirst({
        where: { id: studentId, companyId },
    })

    if (!student) {
        throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    return student;
}

export function mapStudent(student: Student) {
    return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        address: student.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        joiningDate: student.joiningDate,
        status: student.status,
        batchId: student.batchId,
        courseId: student.courseId,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        companyId: student.companyId
    };
}