import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./redis.config";

const createRateLimitHandler = (message: string) => {
    return (req: Request, res: Response) => {
        const resetTime = req.rateLimit?.resetTime;

        const retryAfterSec = resetTime
            ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
            : 60;

        return res.status(429).json({
            message,
            retryAfterSeconds: retryAfterSec,
        });
    };
};

export function createRateLimiters() {
    return {
        globalRateLimiter: rateLimit({
            windowMs: 60 * 1000,
            max: 100,
            validate: {singleCount: false},
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => redis.sendCommand(args),
                prefix: "rl:global:",
            }),
            handler: createRateLimitHandler("Too many requests. Please try again later."),
        }),
        loginRateLimiter: rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            validate: {singleCount: false},
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => redis.sendCommand(args),
                prefix: "rl:login:",
            }),
            handler: createRateLimitHandler(
                "Too many login attempts. Please try again later.",
            ),
        }),
        registerRateLimiter: rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 15,
            validate: {singleCount: false},
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => redis.sendCommand(args),
                prefix: "rl:register:",
            }),
            handler: createRateLimitHandler(
                "Too many registration attempts. Please try again later.",
            ),
        })
    };
}
