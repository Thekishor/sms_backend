import { Worker } from "bullmq";
import { sendEmail } from "../config/mail.config";
import logger, { logError } from "../config/logger";
import { bullmqRedis } from "../config/redis.config";

const worker = new Worker(
    "email",
    async (job) => {

        // for register email verification otp
        if (job.name === "email-verification") {

            const { email, subject, emailVerificationTemplate } = job.data;

            await sendEmail(email, subject, emailVerificationTemplate);

            logger.info(`Verification email sent to ${email}`);
        }

        // for reset password verification otp mail
        if (job.name === "password-reset") {

            const { email, subject, passwordResetTemplate } = job.data;

            await sendEmail(email, subject, passwordResetTemplate);

            logger.info(`Password reset email sent to ${email}`);
        }

        // for subscription expiry mail
        if (job.name === "subscription-expiry") {

            const { email, subject, subscriptionExpiryTemplate } = job.data;

            await sendEmail(email, subject, subscriptionExpiryTemplate);

            logger.info(`Subscription reminder email sent to ${email}`);
        }
    },
    {
        connection: bullmqRedis,
    }
);

worker.on("ready", () => {
    logger.info(`Email worker is ready`);
})

worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    logError(`Job ${job?.id} failed:`, error);
});

worker.on("error", (error) => {
    logError(`Worker error:`, error);
})