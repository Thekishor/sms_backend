import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import logger, { logError } from "./logger.js";
import { env } from "./env.js";

const adapter = new PrismaNeon({
    connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development"
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
if (env.NODE_ENV === "development") {

    prisma.$on("query", (e) => {
        logger.debug("Prisma Query", {
            query: e.query,
            duration: `${Number.parseFloat(e.duration.toFixed(2))}ms`,
        });
    });


    prisma.$on("warn", (e) => {
        logger.warn("Prisma warning", { message: e.message });
    });
}

prisma.$on("error", (e) => {
    logError("Prisma error", {
        message: e.message,
        target: e.target,
    });
});
