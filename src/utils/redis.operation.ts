import { logError } from "../config/logger.js";
import { redis } from "../config/redis.config.js";

export const redisOperation = {

    // getting data from redis
    async get(key: string) {
        try {
            return await redis.get(key);
        } catch (err) {
            logError("Redis GET failed", err);
            return null;
        }
    },

    // set data into redis
    async setEx(key: string, ttl: number, value: string) {
        try {
            await redis.setEx(key, ttl, value);
        } catch (err) {
            logError("Failed to save data into redis", err);
        }
    },

    // delete from redis
    async del(pattern: string) {
        try {
            for await (const key of redis.scanIterator({
                MATCH: pattern,
                COUNT: 100,
            })) {
                try {
                    await redis.del(key);
                } catch (err) {
                    logError("Failed deleting key", { key, err });
                }
            }

        } catch (err) {
            logError("Failed to delete data from redis", err);
        }
    },

    // get ttl 
    async ttl(key: string) {
        try {
            return await redis.ttl(key);
        } catch (err) {
            logError("Redis TTL failed", err);
            return -1;
        }
    }
}
