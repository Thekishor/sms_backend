import { createClient } from "redis";
import logger, { logError } from "./logger.js";
import { env } from "./env.js";

export const redis = createClient({
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    disableOfflineQueue: true,
    socket: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT),
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

export const connectRedis = () => {
    redis.connect().catch((err) => {
        logError("Redis failed to connect...", err);
    })
}