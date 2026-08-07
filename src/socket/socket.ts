import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import AppError from "../utils/AppError.js";

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.CORS_ORIGIN ||
                "http://localhost:5173",
                "http://localhost:5001",
            ],
            credentials: true,
        },
    });
    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new AppError(
            "Socket.IO is not initialized.",
            500,
            "SOCKET_NOT_INITIALIZED"
        );
    }
    return io;
}