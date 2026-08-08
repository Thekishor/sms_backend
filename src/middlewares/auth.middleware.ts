import { Request, Response, NextFunction } from "express";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { verifyJwtToken } from "../utils/jwt.tokens.js";
import { prisma } from "../config/prisma.js";
import { equalHashToken } from "../utils/hash.js";
import { env } from "../config/env.js"
import { logError } from "../config/logger.js";
import { Status, UserType } from "@prisma/client";
import { redisOperation } from "../utils/redis.operation.js";

export const verifySuperAdminToken =
    async (req: Request, _res: Response, next: NextFunction) => {

        try {
            const authHeader = req.headers.authorization;

            if (!authHeader?.startsWith("Bearer ")) {
                return next(new AppError(
                    "Authentication token is missing",
                    401,
                    "UNAUTHORIZED"
                ));
            }

            const token = authHeader.split(" ")[1];

            const payload = verifyJwtToken(token, env.SUPERADMIN_JWT_ACCESS_SECRET);

            // blacklisted token (super admin)
            const key = `blacklisted::${payload.jti}`;

            const isBlacklisted = await redisOperation.get(key);

            if (isBlacklisted) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const superAdmin = await prisma.superAdmin.findUnique({
                where: {
                    id: payload.sub
                }
            });

            if (!superAdmin?.lastToken) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            const isTokenValid = equalHashToken(token, superAdmin.lastToken);

            if (!isTokenValid) {
                throw new AppError("Invalid token", 401, "UNAUTHORIZED");
            }

            req.superadmin = {
                id: superAdmin.id,
                role: superAdmin.role,
                sid: payload.sid,
                fullName: superAdmin.fullName,
                email: superAdmin.email,
                phone: superAdmin.phone,
                createdAt: superAdmin.createdAt,
                updatedAt: superAdmin.updatedAt,
                expiresAt: superAdmin.expiresAt ?? undefined
            }

            req.tokenInfo = {
                token,
                expires: payload.exp ?? 0,
                jti: payload.jti ?? ""
            };

            return next();

        } catch (error) {
            logError("Authentication middleware error", error);
            return next(error);
        }
    }

export const verifyToken =
    async (req: Request, _res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return next(new AppError(
                "Authentication token is missing",
                401,
                "UNAUTHORIZED"
            ));
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = verifyJwtToken(token, env.JWT_ACCESS_SECRET);

            //blacklisted token (admin or staff)
            const key = `blacklisted:${payload.jti}`;

            const isBlacklisted = await redisOperation.get(key);

            if (isBlacklisted) {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

            if (payload?.type === UserType.ADMIN) {

                const admin = await prisma.admin.findUnique({
                    where: {
                        id: payload.sub
                    }
                });

                if (!admin || admin.tokenVersion !== payload.version) {
                    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
                }

                if (admin.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[admin.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                req.admin = {
                    id: admin.id,
                    role: admin.role,
                    sid: payload.sid,
                    type: UserType.ADMIN,
                    fullName: admin.fullName,
                    email: admin.email,
                    phone: admin.phone,
                    createdAt: admin.createdAt,
                    updatedAt: admin.updatedAt,
                    address: admin.address,
                    status: admin.status,
                }

                req.tokenInfo = {
                    token,
                    expires: payload.exp ?? 0,
                    jti: payload.jti ?? ""
                };

            } else if (payload?.type === UserType.STAFF) {

                const staff = await prisma.staff.findFirst({
                    where: { id: payload.sub, companyId: payload.cid }
                });

                if (!staff || staff.tokenVersion !== payload.version) {
                    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
                }

                if (staff.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[staff.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                req.staff = {
                    id: staff.id,
                    roles: staff.roles,
                    permissions: staff.permissions,
                    status: staff.status,
                    sid: payload.sid,
                    companyId: staff.companyId,
                    type: UserType.STAFF,
                    fullName: staff.fullName,
                    email: staff.email,
                    phone: staff.phone,
                    createdAt: staff.createdAt,
                    updatedAt: staff.updatedAt,
                    address: staff.address,
                    createdBy: staff.createdBy,
                };

                req.tokenInfo = {
                    token,
                    expires: payload.exp ?? 0,
                    jti: payload.jti ?? ""
                };

            } else {
                return next(new AppError(
                    "Unauthorized",
                    401,
                    "UNAUTHORIZED"
                ));
            }

            return next();

        } catch (error) {
            logError("Authentication middleware error", error);
            return next(error);
        }
    }