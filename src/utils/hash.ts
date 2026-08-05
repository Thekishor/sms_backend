import bcrypt from "bcrypt";
import { createHash } from "node:crypto";

export function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function equalHashToken(token: string, lastToken: string) {
    return hashToken(token) === lastToken;
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 14);
}

export async function checkPassword(password: string, dbPassword: string) {
    return await bcrypt.compare(password, dbPassword);
}