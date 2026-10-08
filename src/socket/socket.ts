import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "node:http";
import AppError from "../utils/AppError.js";
import { authenticateSocketToken } from "./auth.socket.js";
import { logError } from "../config/logger.js";

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

    io.use((socket: Socket, next: (err?: Error) => void) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const { payload } = authenticateSocketToken(token);

            socket.data.user = payload;

            next();

        } catch (error) {
            logError("Socket authentication error:", error);
            return next(error instanceof Error ? error : new AppError("Unauthorized", 401, "UNAUTHORIZED"));
        }
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