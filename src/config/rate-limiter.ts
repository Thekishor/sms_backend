import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { RedisStore } from "rate-limit-redis";
import {redis} from "./redis.config";
import { logError } from "./logger";

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

// helper to safely execute Redis commands
const safeSendCommand = async (...args: string[]): Promise<any> => {

    if (!redis.isOpen) {
        try {
            await redis.connect();
        } catch (error) {
            logError("Redis connection failed", error);
        }
    }
    return redis.sendCommand(args);
}

// global rate limiter for all routes
export function globalRateLimiter () { 
    return rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,

        store: new RedisStore({
            sendCommand: safeSendCommand}),
        handler: createRateLimitHandler("Too many requests. Please try again later."),
    });
}

// login rate limiter
export function loginRateLimiter () { 
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,

        //redis store configuration
        store: new RedisStore({
            sendCommand: (...args: string[]) => redis.sendCommand(args),
        }),

        handler: createRateLimitHandler("Too many login attempts. Please try again later."),
   });
}

// register rate limiter
export function registerRateLimiter () {
    return rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 15,
        standardHeaders: true,
        legacyHeaders: false,

        store: new RedisStore({
            sendCommand: (...args: string[]) => redis.sendCommand(args),
        }),

        handler: createRateLimitHandler("Too many registration attempts. Please try again later."),
    });
}
