import cron from 'node-cron';
import { prisma } from '../../config/prisma.js';
import logger, { logError } from '../../config/logger.js';
import { SubscriptionStatus } from '@prisma/client';
import { EMAIL_TEMPLATES, SUBSCRIPTION_REMINDER_TEMPLATE } from '../../utils/templates.js';
import { sendEmail } from '../../service/email.service.js';

// Runs every day at 1:20 PM corn jobs
cron.schedule('20 13 * * *', async () => {
    try {
        logger.info(`Subscription reminder job started at ${new Date()}`);

        const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

        const startOfTargetDay = new Date(targetDate);
        startOfTargetDay.setHours(0, 0, 0, 0);

        const startOfNextDay = new Date(startOfTargetDay);
        startOfNextDay.setDate(startOfNextDay.getDate() + 1);

        const subscriptions = await prisma.subscription.findMany({
            where: {
                endDate: {
                    gte: startOfTargetDay,
                    lt: startOfNextDay
                },
                status: SubscriptionStatus.ACTIVE
            },
            include: {
                company: true
            }
        });

        for (const subscription of subscriptions) {

            // get company information
            const companyEmail = subscription.company.email;
            const companyName = subscription.company.name;
            const subscriptionType = subscription.type;

            //days remaining calculate
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;

            const daysRemaining = Math.ceil(
                (subscription.endDate.getTime() - Date.now()) / ONE_DAY_MS
            );

            const expiryDate = subscription.endDate
                .toLocaleString("en-GB", {
                    timeZone: "Asia/Kathmandu",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
                .replace("am", "AM")
                .replace("pm", "PM");

            await sendEmailToCompany(
                companyEmail,
                companyName,
                subscriptionType,
                expiryDate,
                daysRemaining
            );
        }

    } catch (error) {
        logError("Failed to send subscription reminder mail to company", error);
    }
}, {
    timezone: 'Asia/Kathmandu'
});

export async function sendEmailToCompany(
    email: string,
    companyName: string,
    subscriptionType: string,
    expiryDate: string,
    daysRemaining: number
) {
    const { title, subject, message } = EMAIL_TEMPLATES.SUBSCRIPTION_REMINDER;
    const html = SUBSCRIPTION_REMINDER_TEMPLATE(title, companyName, subscriptionType, message, expiryDate, daysRemaining);
    await sendEmail(email, subject, html);
}