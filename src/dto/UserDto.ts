export interface AttemptOtpCount {
    attemptCount: number;
    maxAttemptCount: number;
    isBlocked: boolean;
    blockedUntil?: Date;
    otpSendAt?: number;
}