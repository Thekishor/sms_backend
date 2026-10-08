import { Socket, Server } from "socket.io";
import logger from "../config/logger.js";
export class SocketHandler {

    // listening on 'io' (server level)
    public static register(io: Server): void {
        io.on("connection", (socket: Socket) => {

            logger.info(`Client connected: ${socket.id}`);
            logger.info(`Client IP: ${socket.handshake.address}`);

            // all devices belonging to user are in the same room.
            const userId = socket.data.user.sub;
            logger.info(`User ${userId} joined room user:${userId}`);
            void socket.join(`user:${userId}`);

            this.handleError(socket);
            this.handleDisconnect(socket);
        });
    }

    private static handleError(socket: Socket): void {
        socket.on("error", (err) => {
            logger.error(`Error: ${err.message}: Client Address:${socket.handshake.address}`);
        })
    }

    private static handleDisconnect(socket: Socket): void {
        socket.on("disconnect", () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    }
}