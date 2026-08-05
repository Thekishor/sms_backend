import corn from 'node-cron';
import { prisma } from '../../config/prisma.js';
import logger, { logError } from '../../config/logger.js';

// runs every day at 1:05 PM corn jobs
corn.schedule('5 13 * * *', async () => {

    try {
        logger.info("Session cleanup job executed at:", new Date());

        const now = new Date();

        await prisma.session.deleteMany({
            where: {
                revoked: true,
                updatedAt: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                }
            },
        })
    } catch (error) {
        logError("Failed to delete revoked/expired sessions", error);
    }
}, {
    timezone: 'Asia/Kathmandu'
})