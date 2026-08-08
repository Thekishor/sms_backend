import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "node:http";
import AppError from "../utils/AppError.js";
import { authenticateSocketToken } from "./auth.socket.js";
import { SocketStore } from "./socketStore.js";

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

            const { sub, sid, type, version } = payload;

            if (!sub || !sid || !type || typeof version !== "number") {
                throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
            }

            socket.data.user = payload;

            SocketStore.addUser(
                sub,
                socket.id
            );

            next();

        } catch {
            return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
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