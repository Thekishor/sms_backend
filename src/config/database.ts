import logger, { logError } from "./logger.js";
import { prisma } from "./prisma.js";

const connectDB = async () => {
    try {
        await prisma.$connect();
        logger.info("DB Connected via prisma");
    } catch (error) {
        logError("Database Connection error:", error);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await prisma.$disconnect();
    logger.info("DB Disconnected");
}

export { connectDB, disconnectDB, };
export { prisma } from "./prisma.js";