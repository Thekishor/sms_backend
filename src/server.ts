import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import app from "./app.js";
import { connectDB, disconnectDB } from "./config/database.js";
import logger, { logError } from "./config/logger.js";
import { createServer } from "node:http";
import { initializeSocket } from "./socket/socket.js";
import { SocketHandler } from "./socket/socketHandler.js";

const httpServer = createServer(app);

// initialize socket.io
const io = initializeSocket(httpServer);
SocketHandler.register(io);

await connectDB();

const PORT = process.env.PORT || 3000;

const server = httpServer.listen(PORT, () => {
    logger.info("Server started on port", { port: PORT });
})

// Handle unhandled promise rejections (e.g database connection errors)
process.on("unhandledRejection", (err) => {
    logError("Unhandled Rejection:", err);
    server.close(async () => {
        await disconnectDB();
        process.exit(1);
    });
});

// Handles unexpected sync errors (like undefined variable, crash).
process.on("uncaughtException", async (err) => {
    logError("Uncaught Exception:", err);
    await disconnectDB();
    process.exit(1);
});

// Triggered when app is being stopped (Docker, Kubernetes, cloud, etc.)
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(async () => {
        await disconnectDB();
        process.exit(0);
    });
});