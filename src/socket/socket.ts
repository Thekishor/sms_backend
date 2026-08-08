import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "node:http";
import AppError from "../utils/AppError.js";
import { env } from "../config/env.js";
import { verifyJwtToken } from "../utils/jwt.tokens.js";

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

            let payload;

            payload = verifyJwtToken(token, env.SUPERADMIN_JWT_ACCESS_SECRET);

            if (payload.role === 'SUPERADMIN') {
                socket.data.superadmin = payload;
            } else {
                payload = verifyJwtToken(token, env.JWT_ACCESS_SECRET);
                socket.data.user = payload;
            }
            next();
        } catch {
            next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
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