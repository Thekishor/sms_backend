import corn from 'node-cron';
import { prisma } from '../../config/prisma.js';
import logger, { logError } from '../../config/logger.js';
import { Status } from '@prisma/client';

// runs every day at 1:10 PM corn jobs
corn.schedule('10 13 * * *', async () => {
    try {
        logger.info("Admin delete job executed at:", new Date());

        const now = new Date();

        await prisma.admin.deleteMany({
            where: {
                status: Status.UNVERIFIED,
                createdAt: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                }
            },
        })
    } catch (error) {
        logError("Failed to delete unverified admins", error);
    }
}, {
    timezone: 'Asia/Kathmandu'
})