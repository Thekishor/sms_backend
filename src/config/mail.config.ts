import { Resend } from 'resend';
import logger, { logError } from './logger.js';
import { env } from './env.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: env.DOMAIN,
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            logError("Failed to send email", error);
            return { success: false };
        }

        logger.info("Email sent successfully", {data});
        return { success: true};

    } catch (error) {
        logError("Failed to send email", error);
        return { success: false };
    }
}