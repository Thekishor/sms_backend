import { Resend } from 'resend';
import logger, { logError } from '../config/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            logError("Failed to send email", error.message);
            return { success: false };
        }

        logger.info("Email sent", data);
        return { success: true, data };

    } catch (error) {
        logError("Email service crash", error);
        return { success: false };
    }
}