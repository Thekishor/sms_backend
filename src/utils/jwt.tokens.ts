import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "./AppError.js";

export function generateAccessToken(claims: Record<string, any>, jwtSecret: string, expiry: any) {
    const payload = { ...claims };
    return jwt.sign(payload, jwtSecret, { expiresIn: expiry });
}

export function generateRefreshToken(claims: Record<string, any>, jwtSecret: string, expiry: any) {
    const payload = { ...claims };
    return jwt.sign(payload, jwtSecret, { expiresIn: expiry });
}

export function verifyJwtToken(token: string, jwtSecret: string): JwtPayload {
    try {
        return jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (error) {

        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError("Token expired", 401, "TOKEN_EXPIRED");
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError("Invalid token", 401, "INVALID_TOKEN");
        }

        throw new AppError("Authentication failed", 401, "AUTH_FAILED");
    }
}