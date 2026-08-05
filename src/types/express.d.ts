import { UUID } from "crypto";
import "express-serve-static-core";

interface BaseUserInfo {
    id: string;
    sid: string;
    fullName: string;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}

interface SuperAdminInfo extends BaseUserInfo {
    role: string;
    expiresAt?: Date;
}

interface AdminInfo extends BaseUserInfo {
    role: string;
    type: string;
    status: string;
    address: string;
}

interface StaffInfo extends BaseUserInfo {
    roles: string[];
    permissions: string[];
    status: string;
    companyId: string;
    type: string;
    address: string;
    createdBy: string;
}

export type TokenInfo = {
    token: string,
    expires: number,
    jti: string
}

// for superadmin, admin, staff and token store after verify token
declare module "express-serve-static-core" {
    interface Request {
        superadmin?: SuperAdminInfo;
        admin?: AdminInfo;
        staff?: StaffInfo;
        tokenInfo?: TokenInfo,
        companyId?: string;
        rateLimit?: {
            limit: number;
            used: number;
            remaining: number;
            resetTime: Date;
        };
    }
}