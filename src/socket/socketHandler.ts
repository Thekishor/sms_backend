import { Socket, Server } from "socket.io";
import logger from "../config/logger.js";
import { SocketStore } from "./socketStore.js";

export class SocketHandler {

    public static register(io: Server): void {
        io.on("connection", (socket: Socket) => {
            logger.info(`Client connected: ${socket.id}`);

            this.handleIdentify(socket);
            this.handleDisconnect(socket);
        });
    }

    private static handleIdentify(socket: Socket): void {
        socket.on("identify", ({ userId }: IdentifyPayload) => {
            logger.info(`Identify: ${userId} -> ${socket.id}`);

            SocketStore.addUser(
                userId,
                socket.id
            );
        });
    }

    private static handleDisconnect(socket: Socket): void {
        socket.on("disconnect", () => {
            const userId = SocketStore.getUserId(socket.id);
            if (userId) {
                SocketStore.removeUser(userId);

            }
            logger.info(`Client disconnected: ${socket.id}`);
        });
    }
}

interface IdentifyPayload {
    userId: string;
}