import corn from 'node-cron';
import { prisma } from '../../config/prisma.js';
import { Status } from '@prisma/client';
import logger, { logError } from '../../config/logger.js';

// runs every day at 1:15 PM 
corn.schedule('15 13 * * * ', async () => {
    try {
        logger.info("Company schedule job executed at:", new Date());

        const now = new Date();

        // marks as REJECTED after 24 hrs
        await prisma.company.updateMany({
            where: {
                status: Status.PENDING,
                createdAt: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                }
            },
            data: {
                status: Status.REJECTED
            }
        })

        // delete companies after 24 hrs
        await prisma.company.deleteMany({
            where: {
                status: Status.REJECTED,
                updatedAt: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                }
            }
        })
    } catch (error) {
        logError("Failed to perform company schedule jobs", error);
    }
}, {
    timezone: 'Asia/Kathmandu'
});