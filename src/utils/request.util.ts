import { Request } from "express";
import AppError from "./AppError.js";

export function requireCompanyId(req: Request): string {
    if (!req.companyId) {
        throw new AppError(
            "Company context missing",
            500,
            "COMPANY_ID_MISSING"
        );
    }

    return req.companyId;
}

export function requireAdmin(req: Request): string {
    if (!req.admin) {
        throw new AppError(
            "Access denied",
            403,
            "FORBIDDEN"
        );
    }

    return req.admin.id;
}

export function requireSuperAdmin(req: Request): string {
    if (!req.superadmin) {
        throw new AppError(
            "Unauthorized",
            401,
            "UNAUTHORIZED"
        );
    }

    return req.superadmin.id;
}

export function requireUser(req: Request): string {

    const createdBy = req.admin?.id ?? req.staff?.id;

    if (!createdBy) {
        throw new AppError(
            "Authentication context missing",
            500,
            "AUTH_CONTEXT_MISSING"
        );
    };

    return createdBy;
}