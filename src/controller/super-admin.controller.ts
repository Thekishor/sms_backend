import { NextFunction, Request, Response } from "express"
import AppError from "../utils/AppError.js"
import { logError } from "../config/logger.js";
import { redisOperation } from "../utils/redis.operation.js";
import { prisma } from "../config/database.js";

export const getMeSuperAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.superadmin) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            return res.status(200).json({
                message: "Super Admin retrieved successfully",
                superAdmin: {
                    id: req.superadmin.id,
                    fullName: req.superadmin.fullName,
                    email: req.superadmin.email,
                    phone: req.superadmin.phone,
                    role: req.superadmin.role,
                    createdAt: req.superadmin.createdAt,
                    updatedAt: req.superadmin.updatedAt,
                },
            });

        } catch (err) {
            logError("Failed to get superadmin", err);
            return next(err);
        }
    };

export const logoutSuperAdmin =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (!req.superadmin || !req.tokenInfo) {
                return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
            }

            const tokenInfo = req.tokenInfo;
            const superAdmin = req.superadmin;

            if (superAdmin.expiresAt && superAdmin.expiresAt > new Date()) {

                // make token null
                await prisma.superAdmin.update({
                    where: { id: superAdmin.id },
                    data: {
                        lastToken: null,
                        expiresAt: null
                    },
                });

                // blacklisted token
                await storeBlacklistedToken(tokenInfo.jti, tokenInfo.expires);
            }

            return res.status(200).json({
                message: "Super admin logged out successfully"
            });

        } catch (err) {
            logError("Failed to logout superadmin", err);
            return next(err);
        }
    }

export const storeBlacklistedToken =
    async (token: string, expiry: number,) => {

        const ttl = expiry - Math.floor(Date.now() / 1000);
        const key = `blacklisted::${token}`;
        await redisOperation.setEx(key, ttl, "blacklisted");
    };