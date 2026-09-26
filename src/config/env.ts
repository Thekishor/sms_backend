import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const envSchema = z.object({
    CORS_ORIGIN: z.string(),
    PORT: z.string().transform((val) => Number.parseInt(val)),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    SUPERADMIN_JWT_ACCESS_SECRET: z.string(),
    SUPERADMIN_JWT_ACCESS_EXPIRY: z.string(),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRY: z.string(),
    REFRESH_TOKEN_EXPIRY: z.string(),
    REDIS_URL: z.string(),
    RESEND_API_KEY: z.string(),
    DATABASE_URL: z.string(),
    DOMAIN: z.string(),
})

export const env = envSchema.parse(process.env);