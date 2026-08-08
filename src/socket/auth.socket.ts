import { verifyJwtToken } from "../utils/jwt.tokens"
import { env } from "../config/env";
import AppError from "../utils/AppError";

export const authenticateSocketToken = (token: string) => {

    // try super admin
    try {
        const payload = verifyJwtToken(
            token,
            env.SUPERADMIN_JWT_ACCESS_SECRET
        );

        if (payload.type === "SUPERADMIN") {
            return {
                payload
            };
        }
    } catch {}

    // try admin / staff
    try {
        const payload = verifyJwtToken(
            token,
            env.JWT_ACCESS_SECRET
        );

        if (["ADMIN", "STAFF"].includes(payload.type)) {
            return {
                payload
            };
        }
    } catch {}

    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

}