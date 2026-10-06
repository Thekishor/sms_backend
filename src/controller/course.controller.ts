import { Request, Response, NextFunction } from "express";
import { PaginationQuery } from "../schemas/request/request.dto.js";
import {
    createCourseService,
    deleteCourseService,
    getCourse,
    getCourses, updateCourseService
} from "../service/course.service.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import { requireCompanyId } from "../utils/request.util.js";

export const createCourse =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const companyId = requireCompanyId(req);

            const { course } = await createCourseService(companyId, req.body);

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
            const query = res.locals.query as PaginationQuery;
            const { skip, take, search, orderBy } = parseQuery(query);

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

            const { course } = await updateCourseService(companyId, courseId, req.body);

            return res.status(200).json({
                message: "Course updated successfully",
                course
            });

        } catch (err) {
            logError("Failed to update course", err);
            return next(err);
        }
    }