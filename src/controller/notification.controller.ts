import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError.js";
import { z } from "zod";
import { paginationSchema } from "../schemas/request/request.dto.js";
import { parseQuery } from "../utils/query.util.js";
import { logError } from "../config/logger.js";
import {
    getNotificationsForUser,
    markAsRead,
    markAllAsRead
} from "../service/notification.service.js";

export const getNotifications =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.superadmin) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const result = paginationSchema.safeParse(req.query);

            if (!result.success) {
                throw new AppError(
                    "Validation failed",
                    400,
                    "VALIDATION_ERROR",
                    z.flattenError(result.error).fieldErrors
                );
            }

            const { skip, take } = parseQuery(result.data);

            const { notifications, total } = await getNotificationsForUser(
                req.superadmin.id,
                skip,
                take
            );

            return res.status(200).json({
                message: "Notifications retrieved successfully",
                notifications,
                total
            });

        } catch (err) {
            logError("Failed to get notifications", err);
            return next(err);
        }
    };

export const updateNotificationReadStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.superadmin) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const notificationId = req.params.id;
            const updated = await markAsRead(notificationId, req.superadmin.id);

            return res.status(200).json({
                message: "Notification marked as read successfully",
                notification: updated
            });

        } catch (err) {
            logError("Failed to update notification status", err);
            return next(err);
        }
    };

export const updateAllNotificationsReadStatus =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.superadmin) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            await markAllAsRead(req.superadmin.id);

            return res.status(200).json({
                message: "All notifications marked as read successfully"
            });

        } catch (err) {
            logError("Failed to mark all notifications as read", err);
            return next(err);
        }
    };
