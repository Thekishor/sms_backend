import { Request, Response, NextFunction } from 'express';
import AppError from "../utils/AppError.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { UserType } from '@prisma/client';
import { logError } from '../config/logger.js';

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const permissionMiddleware = (permissions: Permission[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        try {
            if (req.admin) {
                return next();
            }

            const staff = req.staff;

            if (staff?.type !== UserType.STAFF) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const hasPermission = permissions.some((p) => staff.permissions.includes(p));

            if (!hasPermission) {
                throw new AppError(
                    "Access denied. Insufficient permission",
                    403,
                    "PERMISSION_FORBIDDEN"
                );
            }

            return next();

        } catch (error) {
            logError("Failed to verify permission", error);
            return next(error);
        }
    }
}

export default permissionMiddleware;