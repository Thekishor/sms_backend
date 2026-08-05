import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import AppError from "../utils/AppError";

export const validateRequest = <T extends z.ZodType>(schema: T) =>
    (req: Request, _: Response, next: NextFunction) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                "Validation failed.",
                400,
                "VALIDATION_ERROR",
                z.flattenError(result.error).fieldErrors
            );
        }

        req.body = result.data;
        return next();
    }

export const validateParams = <T extends z.ZodTypeAny>(schema: T) =>
    (req: Request, _: Response, next: NextFunction) => {

        const result = schema.safeParse(req.params);

        if (!result.success) {
            throw new AppError(
                "Validation failed.",
                400,
                "VALIDATION_ERROR",
                z.flattenError(result.error).fieldErrors
            );
        }

        return next();
    }