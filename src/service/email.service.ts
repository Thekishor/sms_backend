import { COMPANY_STATUS_UPDATE, EMAIL_TEMPLATES, OTP_TEMPLATE, SUBSCRIPTION_REMINDER_TEMPLATE } from "../utils/templates.js";
import { logError } from "../config/logger.js";
import AppError from "../utils/AppError.js";
import { emailQueue } from "../queues/email.queue.js";

export async function sendEmailToAdmin(
    subject: string,
    title: string,
    message: string,
    expiry: string,
    email: string,
    otp: string
) {

    if (title === "Email Verification") {

        const emailVerificationTemplate = OTP_TEMPLATE(title, message, otp, expiry);

        try {

            await emailQueue.add("email-verification", {
                email,
                subject,
                emailVerificationTemplate
            }, {
                removeOnComplete: {
                    age: 300,
                },
                removeOnFail: {
                    age: 300
                },
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                }
            })
        } catch (error) {
            logError("Failed to queue verification email:", error);

            throw new AppError(
                "Unable to process verification email. Please try again.",
                503,
                "EMAIL_QUEUE_ERROR"
            );
        }
    }

    else if (title === "Password Reset") {

        const passwordResetTemplate = OTP_TEMPLATE(title, message, otp, expiry);

        try {

            await emailQueue.add("password-reset", {
                email,
                subject,
                passwordResetTemplate
            }, {
                removeOnComplete: {
                    age: 300,
                },
                removeOnFail: {
                    age: 300
                },
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                }
            })
        } catch (error) {
            logError("Failed to queue reset password email:", error);

            throw new AppError(
                "Unable to process reset password email. Please try again.",
                503,
                "EMAIL_QUEUE_ERROR"
            );
        }
    }

    else {
        throw new AppError(
            "Invalid email title provided. Please provide a valid title.",
            400,
            "INVALID_EMAIL_TITLE"
        );
    }
}

export async function sendEmailToCompany(
    email: string,
    companyName: string,
    subscriptionType: string,
    expiryDate: string,
    daysRemaining: number
) {
    const { title, subject, message } = EMAIL_TEMPLATES.SUBSCRIPTION_REMINDER;
    const subscriptionExpiryTemplate = SUBSCRIPTION_REMINDER_TEMPLATE(
        title, companyName, subscriptionType, message, expiryDate, daysRemaining
    );

    try {

        await emailQueue.add("subscription-expiry", {
            email,
            subject, subscriptionExpiryTemplate
        }, {
            removeOnComplete: {
                age: 300,
            },
            removeOnFail: {
                age: 300
            },
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            }
        })
    } catch (error) {
        logError("Failed to queue subscription expiring email:", error);

        throw new AppError(
            "Unable to process subscription expiring email. Please try again.",
            503,
            "EMAIL_QUEUE_ERROR"
        );
    }

}

export async function sendCompanyStatusMail(
    email: string,
    adminName: string,
    companyName: string,
    oldStatus: string,
    newStatus: string,
    reason: string
) {

    const companyStatusTemplate = COMPANY_STATUS_UPDATE(
        adminName, companyName, oldStatus, newStatus, reason
    );

    const subject = "Company Status Update Notification";

    try {

        await emailQueue.add("company-status-update", {
            email,
            subject,
            companyStatusTemplate
        }, {
            removeOnComplete: {
                age: 300,
            },
            removeOnFail: {
                age: 300
            },
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            }
        })
    } catch (error) {
        logError("Failed to queue company status update mail:", error);

        throw new AppError(
            "Unable to process company status update email. Please try again.",
            503,
            "EMAIL_QUEUE_ERROR"
        );
    }
}