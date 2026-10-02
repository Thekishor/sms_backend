import { Request, Response, NextFunction } from "express";
import AppError, { STATUS_ERROR } from "../utils/AppError.js";
import { logError } from "../config/logger.js";
import { prisma } from "../config/database.js";
import {
    checkPassword,
    equalHashToken,
    hashToken
} from "../utils/hash.js";
import { env } from "../config/env.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyJwtToken
} from "../utils/jwt.tokens.js";
import { Role, Status, UserType } from "@prisma/client";
import { redisOperation } from "../utils/redis.operation.js";
import { randomUUID } from "node:crypto";
import { TokenInfo } from "../types/express.js";
import { mapAdmin } from "../service/admin.service.js";
import { mapStaff } from "../service/staff.service.js";
import { mapSuperAdmin } from "./super-admin.controller.js";

export const loginUser =
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { ipAddress, userAgent } = getRequestMetadata(req);
            const { loginIdentifier, password } = req.body;
            const authUser = await findUserForLogin(loginIdentifier);

            if (!authUser) {
                throw new AppError(
                    "Invalid credentials",
                    401,
                    "INVALID_CREDENTIALS"
                );
            }

            const { user, userType } = authUser;

            if (userType !== UserType.SUPERADMIN) {
                await checkUserPassword(password, user.password);

                if (user.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[user.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }
            }

            if (userType === UserType.SUPERADMIN) {

                // verify password
                await checkUserPassword(password, user.password);

                // generate access token and return
                const superAdminAccessToken = generateAccessToken(
                    { sub: user.id, role: user.role, type: userType, jti: randomUUID() },
                    env.SUPERADMIN_JWT_ACCESS_SECRET,
                    env.SUPERADMIN_JWT_ACCESS_EXPIRY,
                );

                const hashAccessToken = hashToken(superAdminAccessToken);

                await prisma.superAdmin.update({
                    where: { id: user.id },
                    data: {
                        lastToken: hashAccessToken,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });

                return res.status(200).json({
                    message: "Login successfully",
                    superAdmin: mapSuperAdmin(user),
                    token: superAdminAccessToken,
                });

            } else if (userType === UserType.ADMIN) {

                const { accessToken, refreshToken } = await createUserLoginSession({
                    user,
                    userType,
                    ipAddress,
                    userAgent,
                    accessPayload: {
                        role: user.role,
                    },
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                })

                return res.status(200).json({
                    message: "Login successfully",
                    admin: mapAdmin(user),
                    token: accessToken,
                });

            } else if (userType === UserType.STAFF) {

                const { accessToken, refreshToken } = await createUserLoginSession({
                    user,
                    userType,
                    ipAddress,
                    userAgent,
                    accessPayload: {
                        roles: user.roles,
                        cid: user.companyId,
                        permissions: user.permissions,
                    },
                    sessionData: {
                        companyId: user.companyId,
                    },
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                return res.status(200).json({
                    message: "Login successfully",
                    staff: mapStaff(user),
                    token: accessToken,
                });

            } else {
                throw new AppError(
                    "Invalid credentials",
                    401,
                    "INVALID_CREDENTIALS"
                );
            }

        } catch (err) {
            logError("Failed to login", err);
            return next(err);
        }
    }

export const refreshToken =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const oldRefreshToken = req.cookies.refreshToken;

            if (!oldRefreshToken) {
                throw new AppError(
                    "Invalid or expired token",
                    401,
                    "UNAUTHORIZED"
                );
            }

            const payload = verifyJwtToken(
                oldRefreshToken,
                env.JWT_REFRESH_SECRET
            );

            const { sub, sid, type, version } = payload;

            if (!sub || !sid || !type || typeof version !== "number") {
                throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
            }

            const session = await prisma.session.findFirst({
                where: {
                    id: sid, userId: sub, revoked: false
                }
            });

            if (!session?.hashRefreshToken) {
                throw new AppError(
                    "Your session is invalid. Please log in again.",
                    401,
                    "INVALID_SESSION"
                );
            }

            if (session.expiresAt < new Date()) {
                throw new AppError(
                    "Your session has expired. Please log in again.",
                    401,
                    "SESSION_EXPIRED"
                );
            }

            const isTokenValid = equalHashToken(oldRefreshToken, session.hashRefreshToken);

            if (!isTokenValid) {
                throw new AppError(
                    "Refresh token is invalid",
                    401,
                    "INVALID_TOKEN"
                );
            }

            if (type === UserType.ADMIN) {

                const user = await prisma.admin.findUnique({
                    where: {
                        id: sub
                    }
                });

                if (user?.tokenVersion !== version) {
                    throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
                }

                if (user.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[user.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                const { accessToken, refreshToken } = await createUserRefreshSession({
                    user,
                    userType: UserType.ADMIN,
                    sid,
                    accessPayload: {
                        role: user.role,
                    },
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                return res.status(200).json({
                    message: "Token refreshed successfully",
                    admin: mapAdmin(user),
                    token: accessToken,
                });
            }

            else if (type === UserType.STAFF) {

                const user = await prisma.staff.findUnique({
                    where: { id: sub }
                });

                if (user?.tokenVersion !== version) {
                    throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
                }

                if (user?.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[user.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                const { accessToken, refreshToken } = await createUserRefreshSession({
                    user,
                    userType: UserType.ADMIN,
                    sid,
                    accessPayload: {
                        roles: user.roles,
                        cid: user.companyId,
                        permissions: user.permissions,
                    },
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                return res.status(200).json({
                    message: "Token refreshed successfully",
                    staff: mapStaff(user),
                    token: accessToken,
                });
            }
            else {
                throw new AppError(
                    "Invalid or expired token",
                    401,
                    "UNAUTHORIZED"
                );
            }

        } catch (err) {
            logError("Failed to refresh token", err);
            return next(err);
        }
    }

export const logoutUser =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (req.admin) {
                const adminId = req.admin.id;
                const sessionId = req.admin.sid;
                const tokenInfo = req.tokenInfo;

                if (!tokenInfo) {
                    throw new AppError("Invalid token", 401, "Unauthorized");
                }

                await logoutFromSystem(adminId, sessionId, tokenInfo, res);

                return res.status(200).json({
                    message: "Logged out successfully",
                });

            } else if (req.staff) {

                const staffId = req.staff.id;
                const sessionId = req.staff.sid;
                const tokenInfo = req.tokenInfo;

                if (!tokenInfo) {
                    throw new AppError("Invalid token", 401, "Unauthorized");
                }

                await logoutFromSystem(staffId, sessionId, tokenInfo, res);

                return res.status(200).json({
                    message: "Logged out successfully",
                });

            } else {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }

        } catch (err) {
            logError("Failed to logout", err);
            return next(err);
        }
    }

export const logoutAllDevices =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (req.admin) {

                const adminId = req.admin.id;

                await prisma.session.updateMany({
                    where: { userId: adminId, revoked: false },
                    data: {
                        hashRefreshToken: null,
                        revoked: true
                    }
                });

                await prisma.admin.update({
                    where: { id: adminId },
                    data: {
                        tokenVersion: { increment: 1 }
                    }
                })

                return res.status(200).send({
                    message: "Logged out from all devices successfully"
                });

            } else if (req.staff) {

                const staffId = req.staff.id;

                await prisma.session.updateMany({
                    where: { userId: staffId, revoked: false },
                    data: {
                        hashRefreshToken: null,
                        revoked: true
                    }
                });

                await prisma.staff.update({
                    where: { id: staffId },
                    data: {
                        tokenVersion: { increment: 1 }
                    }
                })

                return res.status(200).send({
                    message: "Logged out from all devices successfully"
                });

            } else {
                throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
            }
        } catch (err) {
            logError("Failed to logout from multiple devices", err);
            return next(err);
        }
    }

export const getUser = (req: Request, res: Response, _: NextFunction) => {

    if (req.admin) {
        return res.status(200).send({
            message: "Admin retrieved successfully",
            admin: {
                id: req.admin.id,
                fullName: req.admin.fullName,
                email: req.admin.email,
                phone: req.admin.phone,
                address: req.admin.address,
                role: req.admin.role,
                status: req.admin.status,
                createdAt: req.admin.createdAt,
                updatedAt: req.admin.updatedAt,
            }
        });

    } else if (req.staff) {
        return res.status(200).json({
            message: "Staff retrieved successfully",
            staff: {
                id: req.staff.id,
                fullName: req.staff.fullName,
                email: req.staff.email,
                phone: req.staff.phone,
                address: req.staff.address,
                roles: req.staff.roles,
                status: req.staff.status,
                createdAt: req.staff.createdAt,
                updatedAt: req.staff.updatedAt,
                createdBy: req.staff.createdBy,
                companyId: req.staff.companyId,
            }
        });

    } else {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }
}

const createUserLoginSession = async ({
    user,
    userType,
    ipAddress,
    userAgent,
    accessPayload,
    sessionData = {}
}: {
    user: any;
    userType: UserType;
    ipAddress: string;
    userAgent: string;
    accessPayload: Record<string, any>;
    sessionData?: Record<string, any>;
}) => {

    const sessionId = crypto.randomUUID();

    const accessToken = generateAccessToken(
        {
            sub: user.id,
            type: userType,
            sid: sessionId,
            version: user.tokenVersion,
            jti: randomUUID(),
            ...accessPayload,
        },
        env.JWT_ACCESS_SECRET,
        env.ACCESS_TOKEN_EXPIRY
    );

    const refreshToken = generateRefreshToken(
        {
            sub: user.id,
            sid: sessionId,
            type: userType,
            version: user.tokenVersion,
            jti: randomUUID(),
        },
        env.JWT_REFRESH_SECRET,
        env.REFRESH_TOKEN_EXPIRY
    );

    await prisma.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            hashRefreshToken: hashToken(refreshToken),
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ...sessionData,
        },
    });

    return { accessToken, refreshToken };
}

const createUserRefreshSession = async ({
    user,
    userType,
    sid,
    accessPayload,
}: {
    user: any;
    userType: UserType;
    sid: string,
    accessPayload: Record<string, any>;
}) => {

    const accessToken = generateAccessToken(
        {
            sub: user.id,
            type: userType,
            sid,
            version: user.tokenVersion,
            jti: randomUUID(),
            ...accessPayload,
        },
        env.JWT_ACCESS_SECRET,
        env.ACCESS_TOKEN_EXPIRY
    );

    const refreshToken = generateRefreshToken(
        {
            sub: user.id,
            sid,
            type: userType,
            version: user.tokenVersion,
            jti: randomUUID(),
        },
        env.JWT_REFRESH_SECRET,
        env.REFRESH_TOKEN_EXPIRY
    );

    await prisma.session.update({
        where: {
            id: sid,
        },
        data: {
            hashRefreshToken: hashToken(refreshToken),
        }
    });

    return { accessToken, refreshToken };
}

async function checkUserPassword(password: string, hashPassword: string) {

    const isPasswordValid = await checkPassword(password, hashPassword);

    if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
}

async function findUserForLogin(loginIdentifier: string) {

    const superAdmin = await prisma.superAdmin.findFirst({
        where: {
            role: "SUPERADMIN",
            OR: [
                { email: loginIdentifier.toLowerCase() },
                { phone: loginIdentifier }
            ]
        }
    });

    if (superAdmin) {
        return {
            user: superAdmin,
            userType: UserType.SUPERADMIN
        }
    }

    const admin = await prisma.admin.findFirst({
        where: {
            role: Role.ADMIN,
            OR: [
                { email: loginIdentifier.toLowerCase() },
                { phone: loginIdentifier }
            ]
        },
    });

    if (admin) {
        return {
            user: admin,
            userType: UserType.ADMIN
        }
    }

    const staff = await prisma.staff.findFirst({
        where: {
            roles: {
                hasSome: [Role.ACCOUNTANT, Role.INSTRUCTOR, Role.MANAGER, Role.RECEPTIONIST]
            },
            OR: [
                { email: loginIdentifier.toLowerCase() },
                { phone: loginIdentifier }
            ]
        }
    });

    if (staff) {
        return {
            user: staff,
            userType: UserType.STAFF
        }
    }

    return null;
}

async function logoutFromSystem(
    userId: string,
    sessionId: string,
    tokenInfo: TokenInfo,
    res: Response
) {

    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId, revoked: false }
    });

    if (!session) {
        throw new AppError("Invalid session", 401, "INVALID_SESSION");
    }

    await prisma.session.update({
        where: { id: session.id },
        data: {
            hashRefreshToken: null,
            revoked: true
        }
    });

    // blacklisted access token
    const blacklisted = `blacklisted:${tokenInfo.jti}`;
    const ttl = tokenInfo.expires - Math.floor(Date.now() / 1000);

    await redisOperation.setEx(
        blacklisted,
        ttl,
        JSON.stringify("blacklisted")
    );

    res.clearCookie("refreshToken");
}

export const getRequestMetadata = (req: Request) => {
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");

    if (!ipAddress) {
        throw new AppError(
            "IP address is missing",
            400,
            "IP_ADDRESS_REQUIRED"
        );
    }

    if (!userAgent) {
        throw new AppError(
            "User-Agent is missing",
            400,
            "USER_AGENT_REQUIRED"
        );
    }

    return {
        ipAddress,
        userAgent
    };
};