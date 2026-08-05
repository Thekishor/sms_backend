import cron from 'node-cron';
import { prisma } from '../../config/prisma.js';
import logger, { logError } from '../../config/logger.js';
import { Status, SubscriptionStatus } from '@prisma/client';

// Runs every day at 12:05 AM every day
cron.schedule('5 0 * * *', async () => {
    try {
        logger.info(`Subscription expiry job started at ${new Date()}`);

        // 1. Find all subscriptions that just expired (endDate passed, still ACTIVE)
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                endDate: { lt: new Date() },
                status: { not: SubscriptionStatus.EXPIRED }
            },
            select: { id: true, companyId: true }
        });

        if (expiredSubscriptions.length === 0) {
            logger.info('No subscriptions to expire');
            return;
        }

        const expiredIds = expiredSubscriptions.map(s => s.id);
        const companyIds = [...new Set(expiredSubscriptions.map(s => s.companyId))];

        // 2. Mark subscriptions as EXPIRED
        const result = await prisma.subscription.updateMany({
            where: { id: { in: expiredIds } },
            data: { status: SubscriptionStatus.EXPIRED }
        });

        logger.info(`Expired subscriptions updated: ${result.count}`);

        // 3. For each affected company, check if they have ANY remaining active subscription.
        //    If not, set the company status to INACTIVE.
        for (const companyId of companyIds) {

            const activeSubscription = await prisma.subscription.findFirst({
                where: {
                    companyId,
                    status: SubscriptionStatus.ACTIVE
                }
            });

            if (!activeSubscription) {
                await prisma.company.update({
                    where: { id: companyId },
                    data: { status: Status.INACTIVE }
                });

                logger.info(`Company ${companyId} set to INACTIVE — no active subscription`);
            }
        }

    } catch (error) {
        logError("Subscription expiry job failed", error);
    }
}, {
    timezone: 'Asia/Kathmandu'
});
