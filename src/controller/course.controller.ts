import { Request, Response, NextFunction } from "express";
import { courseSchema, paginationSchema } from "../schemas/request/request.dto.js";
import { z } from "zod";
import {
    createCourseService,
    deleteCourseService,
    getCourse,
    getCourses,
    getCoursesWithStudents, updateCourseService
} from "../service/course.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createCourse =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const result = courseSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { course } = await createCourseService(companyId, result.data);

            return res.status(200).json({
                message: "Course created successfully",
                course
            });

        } catch (err) {
            logError("Failed to create course", err);
            return next(err);
        }
    }

export const getCourseById =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const courseId = req.params.id;

            const { course } = await getCourse(courseId, companyId);

            return res.status(200).json({
                message: "Course retrieved successfully",
                course
            });

        } catch (err) {
            logError("Failed to get course by Id", err);
            return next(err);
        }
    }

export const getAllCourses =
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

            const { courses, total } = await getCourses(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Courses retrieved successfully",
                courses, total
            });

        } catch (err) {
            logError("Failed to get courses", err);
            return next(err);
        }
    }

export const getAllCoursesWithStudents =
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

            const { courses, total } = await getCoursesWithStudents(
                companyId,
                skip,
                take,
                search,
                orderBy
            );

            return res.status(200).json({
                message: "Courses retrieved successfully",
                courses,
                total
            });

        } catch (err) {
            logError("Failed to get courses with students", err);
            return next(err);
        }
    }

export const deleteCourse =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const courseId = req.params.id;

            await deleteCourseService(companyId, courseId);

            return res.status(200).json({
                message: "Course deleted successfully",
            });

        } catch (err) {
            logError("Failed to delete course", err);
            return next(err);
        }
    }

export const updateCourse =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);
            const courseId = req.params.id;
            const result = courseSchema.safeParse(req.body);

            if (!result.success) {
                throw new AppError(
                    "Validation failed.",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { course } = await updateCourseService(companyId, courseId, result.data);

            return res.status(200).json({
                message: "Course updated successfully",
                course
            });

        } catch (err) {
            logError("Failed to update course", err);
            return next(err);
        }
    }