import logger from "../config/logger.js";
import { getIO } from "./socket.js";
import { SocketStore } from "./socketStore.js";

export class RealtimeService {

    public static notifySuperAdmin(event: string, data: unknown): void {
        const io = getIO();
        io.emit(event, data);
    }

    public static notifyAdmin(
        adminId: string,
        event: string,
        data: unknown
    ): void {
        const io = getIO();

        const socketId = SocketStore.getSocketId(adminId);
        logger.info(`Looking for socket of admin: ${adminId}`);
        logger.info(socketId);

        if (socketId) {
            // Admin is online
            io.to(socketId).emit(event, data);
        } else {
            logger.warn("Unable to send events to admin due to offline mode");
        }
    }
}