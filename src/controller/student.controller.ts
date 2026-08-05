import { Request, Response, NextFunction } from "express";
import { paginationSchema, studentSchema, studentUpdateSchema } from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    changedStatus,
    createStudentService, deleteStudent, getFeeAccountService,
    getStudent, getStudentPayments,
    getStudents,
    getStudentsWithPayments, updateStudent
} from "../service/student.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createStudent =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = studentSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { student } = await createStudentService(result.data, companyId);

            return res.status(200).json({
                message: "Student created successfully",
                student
            });

        } catch (err) {
            logError("Failed to create student", err);
            return next(err);
        }
    }

export const getAllStudents =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = paginationSchema.safeParse(req.query);

            if (!result.success) {
                throw new AppError(
                    "Validation failed",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { skip, take, search, orderBy } = parseQuery(result.data);

            const { students, total } = await getStudents(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Students retrieved successfully",
                students, total
            });

        } catch (err) {
            logError("Failed to get students", err);
            return next(err);
        }
    }

export const getStudentById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;

            const { student } = await getStudent(companyId, studentId);

            return res.status(200).json({
                message: "Student retrieved successfully",
                student
            });

        } catch (err) {
            logError("Failed to get student", err);
            return next(err);
        }
    }

export const getStudentWithPayments =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;

            const { student } = await getStudentPayments(companyId, studentId);

            return res.status(200).json({
                message: "Student retrieved with payment successfully",
                student
            });

        } catch (err) {
            logError("Failed to get student with payment", err);
            return next(err);
        }
    }

export const getAllStudentsWithPayments =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = paginationSchema.safeParse(req.query);

            if (!result.success) {
                throw new AppError(
                    "Validation failed",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { skip, take, search, orderBy } = parseQuery(result.data);

            const { students, total } = await getStudentsWithPayments(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Students retrieved with payments successfully",
                students, total
            });

        } catch (err) {
            logError("Failed to get students with payments", err);
            return next(err);
        }
    }

export const getStudentFeeAccount =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;

            const { student } = await getFeeAccountService(companyId, studentId);

            return res.status(200).json({
                message: "Student retrieved with fee account successfully",
                student
            });

        } catch (err) {
            logError("Failed to get student with fee account", err);
            return next(err);
        }
    }

export const updateStudentById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;

            const result = studentUpdateSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { student } = await updateStudent(studentId, result.data, companyId);

            return res.status(200).json({
                message: "Student updated successfully",
                student
            });

        } catch (err) {
            logError("Failed to update student", err);
            return next(err);
        }
    }

export const changedStudentStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;
            const status = req.body.status.trim();

            const { student } = await changedStatus(companyId, studentId, status);

            return res.status(200).json({
                message: "Student status changed successfully",
                student
            });

        } catch (err) {
            logError("Failed to changed student status", err);
            return next(err);
        }
    }

export const deleteStudentById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const studentId = req.params.id;

            await deleteStudent(studentId, companyId);

            return res.status(200).json({
                message: "Student deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete student", err);
            return next(err);
        }
    }