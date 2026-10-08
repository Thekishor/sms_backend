import { prisma } from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export const getNotificationsForUser =
    async (
        recipientId: string,
        skip: number,
        take: number
    ) => {

        const [notifications, total] = await Promise.all([

            prisma.notification.findMany({
                where: { recipientId, isRead: false },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),

            prisma.notification.count({
                where: { recipientId }
            })
        ]);

        return { notifications, total };
    };

export const markAsRead =
    async (
        notificationId: string,
        recipientId: string
    ) => {

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
                recipientId
            }
        });

        if (!notification) {
            throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            }
        });

        return updated;
    };

export const markAllAsRead =
    async (recipientId: string) => {

        const result = await prisma.notification.updateMany({
            where: {
                recipientId,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date(),
            }
        });

        if (result.count === 0) {
            throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
        }

        return result;
    };
