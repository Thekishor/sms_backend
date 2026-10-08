import { logError } from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import { getIO } from "./socket.js";

export const notifySuperAdmin = async (
    type: string,
    title: string,
    message: string,
    data: unknown
) => {

    try {
        const io = getIO();

        const superAdmins = await prisma.superAdmin.findMany({
            select: { id: true }
        });

        if (superAdmins.length === 0) {
            return;
        }

        for (const superAdmin of superAdmins) {
            const roomName = `user:${superAdmin.id}`;
            const room = io.sockets.adapter.rooms.get(roomName);

            const notification = {
                type, title, message, data
            };

            if (room && room.size > 0) {
                // Super Admin is online
                io.to(roomName).emit("notification", notification);
            } else {
                // Super Admin is offline
                await prisma.notification.create({
                    data: {
                        recipientId: superAdmin.id,
                        title,
                        message,
                        isRead: false
                    }
                });
            }
        }

    } catch (error) {
        logError("Failed to notify super admins", error);
    }
}

export const notifyAdmin = async (
    adminId: string,
    type: string,
    title: string,
    message: string,
    data: unknown
) => {
    try {
        const io = getIO();

        const roomName = `user:${adminId}`;
        const room = io.sockets.adapter.rooms.get(roomName);

        const notification = {
            type, title, message, data
        };

        if (room && room.size > 0) {
            // Admin is online
            io.to(roomName).emit("notification", notification);
        } else {
            // Admin is offline
            await prisma.notification.create({
                data: {
                    recipientId: adminId,
                    title,
                    message,
                    isRead: false
                }
            });
        }

    } catch (error) {
        logError("Failed to notify admin", error);
    }
}