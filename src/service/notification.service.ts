import logger from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import { RealtimeService } from "../socket/realtime.service.js";
import AppError from "../utils/AppError.js";

export const createNotificationForSuperAdmin = async (
    title: string,
    message: string,
    socketEvent: string,
    socketData: any
) => {
    try {
        const superAdmins = await prisma.superAdmin.findMany({
            select: { id: true }
        });

        if (superAdmins.length === 0) {
            return;
        }

        await prisma.notification.createMany({
            data: superAdmins.map((superAdmin) => ({
                recipientId: superAdmin.id,
                title,
                message,
                isRead: false
            }))
        });

        //notify to super admin (socket.io)
        RealtimeService.notifySuperAdmin(socketEvent, socketData);

    } catch (error) {
        logger.error("Failed to save admin registration notifications in database", error);
    }
}

export const createNotificationForAdmin = async (
    adminId: string,
    title: string,
    message: string,
    socketEvent: string,
    socketData: any
) => {
    try {
        await prisma.notification.create({
            data: {
                recipientId: adminId,
                title,
                message,
                isRead: false
            }
        });

        // notify to admin (socket.io)
        RealtimeService.notifyAdmin(adminId, socketEvent, socketData);

    } catch (error) {
        logger.error("Failed to save notification in database", error);
    }
}

export const getNotificationsForUser =
    async (
        recipientId: string,
        skip: number,
        take: number
    ) => {

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { recipientId },
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
            where: { id: notificationId }
        });

        if (!notification) {
            throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
        }

        if (notification.recipientId !== recipientId) {
            throw new AppError("Unauthorized to update this notification", 403, "FORBIDDEN");
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return updated;
    };

export const markAllAsRead =
    async (recipientId: string) => {

        const result = await prisma.notification.updateMany({
            where: { recipientId, isRead: false },
            data: { isRead: true }
        });

        return result;
    };
