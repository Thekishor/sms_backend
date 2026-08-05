import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger, { logError } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "warn" },
            { emit: "stdout", level: "error" }
        ]
        : [
            { emit: "stdout", level: "error" },
        ]
});

// $on only works with emit: "event"
if (process.env.NODE_ENV === "development") {

    prisma.$on("query", (e) => {
        logger.debug("Prisma Query", {
            query: e.query,
            duration: `${Number.parseFloat(e.duration.toFixed(2))}ms`,
        });
    });


    prisma.$on("warn", (e) => {
        logger.warn("Prisma query", { message: e.message });
    });
}

prisma.$on("error", (e) => {
    logError("Prisma error", { message: e.message });
});
