// Static imports at top
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ 
    path: path.resolve(__dirname, "../.env.local"),
});

import { connectRedis, disconnectRedis } from "./config/redis.config.js";
import { connectDB, disconnectDB } from "./config/database.js";
import logger, { logError } from "./config/logger.js";
import { createServer } from "node:http";
import { initializeSocket } from "./socket/socket.js";
import { SocketHandler } from "./socket/socketHandler.js";
import { createApp } from "./app.js";


// Connect Dbs before starting
await connectDB();
await connectRedis();

// Create Server & Sockets
const app = createApp();
const httpServer = createServer(app);
const io = initializeSocket(httpServer);
SocketHandler.register(io);

const PORT = process.env.PORT || 3000;

const server = httpServer.listen(PORT, () => {
    logger.info("Server started on port", { port: PORT });
});

// shutdown helper
async function shutdown(code:number) {
    logger.info("Closing connections...");
    server.close();
    await disconnectDB();
    await disconnectRedis();
    process.exit(code);
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

// Handle unhandled promise rejections (e.g database connection errors)
process.on("unhandledRejection", (err) => {
    logError("Unhandled Rejection:", err);
    shutdown(1);
});

// Handles unexpected sync errors (like undefined variable, crash).
process.on("uncaughtException", async (err) => {
    logError("Uncaught Exception:", err);
    shutdown(1);
});