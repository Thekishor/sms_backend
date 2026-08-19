import { OTP_TEMPLATE } from "../utils/templates.js";
import { sendEmail } from "../config/mail.config.js";

export async function sendEmailToAdmin(
    subject: string,
    title: string,
    message: string,
    expiry: string,
    email: string,
    otp: string
) {
    const html = OTP_TEMPLATE(title, message, otp, expiry);
    await sendEmail(email, subject, html);
}