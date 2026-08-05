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

export const loginUser =
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const ipAddress = req.ip;
            const userAgent = req.get("User-Agent");

            // get ip address and user agent
            if (!ipAddress) {
                throw new AppError("Ip address is missing", 400, "IP_ADDRESS_REQUIRED");
            }

            if (!userAgent) {
                throw new AppError("User Agent is missing", 400, "USER_AGENT_REQUIRED");
            }

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
                    superAdmin: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    },
                    token: superAdminAccessToken,
                });

            } else if (userType === UserType.ADMIN) {

                // verify password
                await checkUserPassword(password, user.password);

                //check status
                if (user.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[user.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                const adminTokenVersion = user.tokenVersion;

                const sessionId = crypto.randomUUID();

                const adminAccessToken = generateAccessToken(
                    {
                        sub: user.id,
                        role: user.role,
                        type: userType,
                        sid: sessionId,
                        version: adminTokenVersion,
                        jti: randomUUID()
                    },
                    env.JWT_ACCESS_SECRET,
                    env.ACCESS_TOKEN_EXPIRY
                );

                const adminRefreshToken = generateRefreshToken(
                    {
                        sub: user.id,
                        sid: sessionId,
                        type: userType,
                        version: adminTokenVersion,
                        jti: randomUUID()
                    },
                    env.JWT_REFRESH_SECRET,
                    env.REFRESH_TOKEN_EXPIRY
                );

                const adminHashRefreshToken = hashToken(adminRefreshToken);

                await prisma.session.create({
                    data: {
                        id: sessionId,
                        userId: user.id,
                        hashRefreshToken: adminHashRefreshToken,
                        ipAddress,
                        userAgent,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                });

                res.cookie("refreshToken", adminRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                })

                return res.status(200).json({
                    message: "Login successfully",
                    admin: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        status: user.status,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    },
                    token: adminAccessToken,
                });

            } else if (userType === UserType.STAFF) {

                // verify password
                await checkUserPassword(password, user.password);

                //check status
                if (user.status !== Status.ACTIVE) {
                    throw new AppError(
                        STATUS_ERROR[user.status],
                        403,
                        "ACCOUNT_NOT_ACTIVE"
                    );
                }

                const staffTokenVersion = user.tokenVersion;

                const sessionId = crypto.randomUUID();

                const staffAccessToken = generateAccessToken(
                    {
                        sub: user.id,
                        roles: user.roles,
                        type: userType,
                        sid: sessionId,
                        cid: user.companyId,
                        permissions: user.permissions,
                        version: staffTokenVersion,
                        jti: randomUUID()
                    },
                    env.JWT_ACCESS_SECRET,
                    env.ACCESS_TOKEN_EXPIRY
                );

                const staffRefreshToken = generateRefreshToken(
                    {
                        sub: user.id,
                        sid: sessionId,
                        type: userType,
                        version: staffTokenVersion,
                        jti: randomUUID()
                    },
                    env.JWT_REFRESH_SECRET,
                    env.REFRESH_TOKEN_EXPIRY
                );

                const hashRefreshToken = hashToken(staffRefreshToken);

                await prisma.session.create({
                    data: {
                        id: sessionId,
                        userId: user.id,
                        hashRefreshToken,
                        ipAddress,
                        userAgent,
                        companyId: user.companyId,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                });

                res.cookie("refreshToken", staffRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                return res.status(200).json({
                    message: "Login successfully",
                    staff: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        status: user.status,
                        roles: user.roles,
                        companyId: user.companyId,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        createdBy: user.createdBy
                    },
                    token: staffAccessToken,
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

            await findUserSessionAndVerify(
                sid,
                oldRefreshToken,
                sub,
                type,
                version,
                res
            );

        } catch (err) {
            logError("Failed to generate token", err);
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

export const getUser =
    async (req: Request, res: Response, next: NextFunction) => {
        try {

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
        } catch (err) {
            logError("Failed to get user information", err);
            return next(err);
        }
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
        }
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

async function findUserSessionAndVerify(
    sessionId: string,
    oldRefreshToken: string,
    sub: string,
    type: UserType,
    version: number,
    res: Response
) {
    const session = await prisma.session.findFirst({
        where: {
            id: sessionId, userId: sub, revoked: false
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

        const admin = await prisma.admin.findUnique({
            where: {
                id: sub
            }
        });

        if (admin?.tokenVersion !== version) {
            throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
        }

        if (admin.status !== Status.ACTIVE) {
            throw new AppError(
                STATUS_ERROR[admin.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const adminAccessToken = generateAccessToken(
            {
                sub: admin.id,
                role: admin.role,
                type: type,
                sid: sessionId,
                version: admin.tokenVersion,
                jti: randomUUID()
            },
            env.JWT_ACCESS_SECRET,
            env.ACCESS_TOKEN_EXPIRY
        );

        const adminRefreshToken = generateRefreshToken(
            {
                sub: admin.id,
                sid: sessionId,
                type: type,
                version: admin.tokenVersion,
                jti: randomUUID()
            },
            env.JWT_REFRESH_SECRET,
            env.REFRESH_TOKEN_EXPIRY
        );

        const adminHashRefreshToken = hashToken(adminRefreshToken);

        await prisma.session.update({
            where: {
                id: sessionId
            },
            data: {
                hashRefreshToken: adminHashRefreshToken,
            }
        })

        res.cookie("refreshToken", adminRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({
            message: "Token generated successfully",
            admin: {
                id: admin.id,
                fullName: admin.fullName,
                email: admin.email,
                phone: admin.phone,
                address: admin.address,
                status: admin.status,
                role: admin.role,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            },
            token: adminAccessToken,
        });

    } else if (type === UserType.STAFF) {

        const staff = await prisma.staff.findUnique({
            where: { id: sub }
        });

        if (staff?.tokenVersion !== version) {
            throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
        }

        if (staff?.status !== Status.ACTIVE) {
            throw new AppError(
                STATUS_ERROR[staff.status],
                403,
                "ACCOUNT_NOT_ACTIVE"
            );
        }

        const staffAccessToken = generateAccessToken(
            {
                sub: staff.id,
                role: staff.roles,
                type: type,
                sid: sessionId,
                cid: staff.companyId,
                permissions: staff.permissions,
                version: staff.tokenVersion,
                jti: randomUUID()
            },
            env.JWT_ACCESS_SECRET,
            env.ACCESS_TOKEN_EXPIRY
        );

        const staffRefreshToken = generateRefreshToken(
            {
                sub: staff.id,
                sid: sessionId,
                type: type,
                version: staff.tokenVersion,
                jti: randomUUID()
            },
            env.JWT_REFRESH_SECRET,
            env.REFRESH_TOKEN_EXPIRY
        );

        const staffHashRefreshToken = hashToken(staffRefreshToken);

        await prisma.session.update({
            where: { id: sessionId },
            data: {
                hashRefreshToken: staffHashRefreshToken,
            }
        })

        res.cookie("refreshToken", staffRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({
            message: "Token generated successfully",
            staff: {
                id: staff.id,
                fullName: staff.fullName,
                email: staff.email,
                phone: staff.phone,
                address: staff.address,
                status: staff.status,
                role: staff.roles,
                createdAt: staff.createdAt,
                updatedAt: staff.updatedAt
            },
            token: staffAccessToken,
        });

    } else {
        throw new AppError(
            "Invalid or expired token",
            401,
            "UNAUTHORIZED"
        );
    }
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