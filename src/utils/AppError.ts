class AppError extends Error {

    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, statusCode: number, code: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;

export const STATUS_ERROR: Record<string, string> = {
    ACTIVE: "Your account is already verified and active.",
    UNVERIFIED: "Please verify your email address before continuing.",
    INACTIVE: "Your account has been deactivated. Contact support for assistance.",
    PENDING: "Your account is pending review. Please wait for approval from the Super Admin.",
    REJECTED: "Your account request has been rejected. Contact support for more information."
};