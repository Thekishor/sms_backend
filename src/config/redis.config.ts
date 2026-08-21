import { createClient } from "redis";
import logger, { logError } from "./logger.js";
import { env } from "./env.js";

export const redis = createClient({
    url: env.REDIS_URL,
    // If Redis is disconnected, commands aren't queued in Node.js waiting for Redis to come back.
    disableOfflineQueue: true,
    socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
            return Math.min(retries * 200, 5000);
        }
    }
});

redis.on("connect", () => {
    logger.info("Redis connected...");
})

redis.on("error", (err) => {
    logError("Redis error...", err);
});

redis.on("ready", () => {
    logger.info("Redis is ready...");
});

redis.on("reconnecting", () => {
    logger.warn("Redis reconnecting...");
});

redis.on("end", () => {
    logger.warn("Redis connection ended...");
});

export const connectRedis = async () => {
    try {
        await redis.connect();
        logger.info("Redis connected successfully");
    } catch (error) {
        logError("Redis failed to connect...", error);
    }
}

export const disconnectRedis = async () => {
    try {
        // graceful shutdown
        await redis.quit();
        logger.info("Redis disconnected gracefully");
    } catch (error) {
        logError("Graceful Redis exit failed, forcing socket destruction...", error);
        redis.destroy();
    }
}