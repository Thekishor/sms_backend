import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { UserType } from "@prisma/client";
import { logError } from "../config/logger.js";

const roleMiddleware = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        try {
            if (req.admin) {
                return next();
            }

            const staff = req.staff;

            if (staff?.type !== UserType.STAFF) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const hasRole = roles.some((role) => staff.roles.includes(role));

            if (!hasRole) {
                throw new AppError(
                    "Access denied. Insufficient role",
                    403,
                    "ROLE_FORBIDDEN"
                );
            }

            return next();

        } catch (error) {
            logError("Failed to verify role", error);
            return next(error);
        }
    }
}

export default roleMiddleware;