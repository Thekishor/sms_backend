export interface AttemptOtpCount {
    attemptCount: number;
    maxAttemptCount: number;
    isBlocked: boolean;
    blockedUntil?: Date;
    otpSendAt?: number;
}
export interface SuperAdminResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AdminResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StaffResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    roles: string[];
    permissions: string[],
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    companyId: string;
}