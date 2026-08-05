import { CourseDto } from "../schemas/request/request.dto.js";
import { prisma } from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { Course, Prisma, Status } from "@prisma/client";
import {
    CourseResponseDto,
    CoursesResponseDto,
    CoursesWithStudentsResponseDto
} from "../schemas/response/response.dto.js";
import { redisOperation } from "../utils/redis.operation.js";

export const createCourseService =
    async (companyId: string, data: CourseDto):
        Promise<{
            course: CourseResponseDto["course"];
        }> => {

        const { name, price, duration, description } = data;

        const existsCourse = await prisma.course.findFirst({
            where: { name, companyId }
        });

        if (existsCourse) {
            throw new AppError("Course already exists", 409, "COURSE_ALREADY_EXISTS");
        }

        const course = await prisma.course.create({
            data: {
                name,
                price: new Prisma.Decimal(price),
                duration,
                description,
                companyId
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:courses*`);

        return {
            course: mapCourse(course)
        };

    }

export const getCourse =
    async (courseId: string, companyId: string): Promise<{
        course: CourseResponseDto["course"];
    }> => {

        const course = await verifyCourse(courseId, companyId);

        return {
            course: mapCourse(course)
        };
    }

export const getCourses =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        courses: CoursesResponseDto["courses"];
        total: number;
    }> => {

        const key = `company:${companyId}:courses:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.CourseWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { duration: { contains: search, mode: "insensitive" } }
                ]
            })
        }

        const [coursesData, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    duration: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    companyId: true
                }
            }),
            prisma.course.count({ where })
        ]);

        if (coursesData.length === 0) {
            return { courses: [], total: 0 }
        }

        const courses = coursesData.map(course => mapCourse(course));

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ courses, total }));

        return { courses, total };
    }

export const getCoursesWithStudents =
    async (
        companyId: string,
        skip: number,
        take: number,
        search: string,
        orderBy: Record<string, "asc" | "desc">
    ): Promise<{
        courses: CoursesWithStudentsResponseDto["courses"];
        total: number;
    }> => {

        const key = `company:${companyId}:courses:students:${skip}:${take}:${search}:${JSON.stringify(orderBy)}`;
        const cached = await redisOperation.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        const where: Prisma.CourseWhereInput = {
            companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { companyId: { contains: search, mode: "insensitive" } }
                ]
            })
        };

        const [coursesData, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    duration: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    companyId: true,
                    students: {
                        where: {
                            status: Status.ACTIVE
                        },
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
                            createdAt: true,
                            updatedAt: true,
                            courseId: true,
                            companyId: true
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);

        if (coursesData.length === 0) {
            return { courses: [], total: 0 }
        }

        const courses = coursesData.map(course => ({
            ...course,
            price: course.price.toString()
        }));

        // set to redis
        await redisOperation.setEx(key, 600, JSON.stringify({ courses, total }));

        return { courses, total };
    }

export const deleteCourseService =
    async (companyId: string, courseId: string) => {

        const course = await verifyCourse(courseId, companyId);

        await prisma.course.delete({
            where: { id: course.id }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:courses*`);
    }

export const updateCourseService =
    async (companyId: string, courseId: string, data: CourseDto)
        : Promise<{
            course: CourseResponseDto["course"];
        }> => {

        const { name, price, duration, description } = data;

        const course = await verifyCourse(courseId, companyId);

        const updatedCourse = await prisma.course.update({
            where: { id: course.id, companyId },
            data: {
                name,
                price: new Prisma.Decimal(price),
                duration,
                description
            }
        });

        // del from redis
        await redisOperation.del(`company:${companyId}:courses*`);

        return {
            course: mapCourse(updatedCourse)
        }
    }

export async function verifyCourse(courseId: string, companyId: string) {

    const course = await prisma.course.findFirst({
        where: { id: courseId, companyId }
    });

    if (!course) {
        throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");
    }

    return course;
}

export function mapCourse(course: Course) {
    return {
        id: course.id,
        name: course.name,
        price: course.price.toString(),
        duration: course.duration,
        description: course.description,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        companyId: course.companyId
    }
}