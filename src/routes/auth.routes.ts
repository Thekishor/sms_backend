import { Router } from "express";
import {
    getUser, loginUser,
    logoutAllDevices, logoutUser,
    refreshToken
} from "../controller/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../config/rate-limiter.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../schemas/request/request.dto.js";

const router = Router();

// login superadmin, admin and staff endpoints
router.post("/login", loginRateLimiter, validateRequest(loginSchema), loginUser);

// get me (admin and staff)
router.get("/me", verifyToken, getUser);

// refresh token for admin and staff
router.post("/refresh-token", refreshToken);

// logout for admin and staff
router.post("/logout", verifyToken, logoutUser);

// logout from multiple devices for admin and staff
router.post("/logout-all", verifyToken, logoutAllDevices);

export default router;