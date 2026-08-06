import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import AppError from "../utils/AppError.js";

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {

    // custom error handling
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            ... (err.details ? { errors: err.details } : {})
        });
    }

    // Prisma error handling
    if (err instanceof Prisma.PrismaClientKnownRequestError) {

        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Unique constraint failed",
                code: "UNIQUE_CONSTRAINT_FAILED",
                statusCode: 409,
            });
        }

        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Record not found",
                code: "RECORD_NOT_FOUND",
                statusCode: 404,
            });
        }

        if (err.code === "P2003") {
            return res.status(409).json({
                success: false,
                message: "Related record not found or invalid reference",
                code: "FOREIGN_KEY_CONSTRAINT_FAILED",
                statusCode: 409,
            });
        }
    }

    // Prisma Schema Validation Errors
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            success: false,
            message: "Provided data type or format is invalid.",
            code: "VALIDATION_ERROR",
            statusCode: 400,
        });
    }

    // fallback for unhandled errors
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
    });

}

export default errorHandler;