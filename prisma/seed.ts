import { prisma } from "../src/config/prisma";
import "dotenv/config";
import { hashPassword } from "../src/utils/hash";
import logger, { logError } from "../src/config/logger";

async function main() {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const phone = process.env.SUPERADMIN_PHONE;
    const fullName = process.env.SUPERADMIN_FULLNAME;

    if (!fullName || !email || !password || !phone) {
        logError("Super admin information required", email);
        process.exit(1);
    }
    const normalizedEmail = email.toLocaleLowerCase().trim();

    const isExists = await prisma.superAdmin.findFirst({
        where: {
            OR: [{ email: normalizedEmail }, { phone }]
        }
    })

    if (isExists) {
        logError("Super admin already exists", email);
        return;
    }

    const passwordHash = await hashPassword(password);

    await prisma.superAdmin.create({
        data: {
            fullName,
            email: normalizedEmail,
            phone,
            password: passwordHash
        }
    });

    logger.info("Super admin created successfully.");
}

try {
    await main();
} catch (error) {
    logError("Failed to create super admin:", error);
    process.exit(1);
}