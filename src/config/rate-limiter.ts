import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

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

// global rate limiter for all routes
export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many requests. Please try again later."),
});

// login rate limiter
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many login attempts. Please try again later."),
});

// register rate limiter
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many registration attempts. Please try again later."),
});
