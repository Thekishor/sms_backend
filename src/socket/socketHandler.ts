import { Socket, Server } from "socket.io";
import logger from "../config/logger.js";
import { SocketStore } from "./socketStore.js";

export class SocketHandler {

    // listening on 'io' (server level)
    public static register(io: Server): void {
        io.on("connection", (socket: Socket) => {
            
            logger.info(`Client connected: ${socket.id}`);
            logger.info(`Client Auth Token: ${socket.handshake.auth.Token}`);
            logger.info(`Client IP: ${socket.handshake.address}`);

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
            const userId = SocketStore.getUserId(socket.id);
            
            if (userId) {
                SocketStore.removeUser(userId);

            }
            logger.info(`Client disconnected: ${socket.id}`);
        });
    }
}