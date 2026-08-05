import { Router } from "express";
import {
    registerAdmin,
    verifyAccountByAdmin, resendOtpForAdmin,
    forgotPasswordAdmin, resetPasswordForAdmin,
    changedPasswordForAdmin, updateAdmin,
} from "../controller/admin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireCompany } from "../middlewares/company.middleware.js";
import {
    changedStaffStatus,
    changePasswordForStaff,
    createStaff,
    deleteStaff, getAllStaff,
    getStaff, updateStaff
} from "../controller/staff.controller.js";
import {
    createCompany,
    deleteCompany,
    getAllCompaniesByAdmin,
    getCompany,
    updateCompany
} from "../controller/company.controller.js";
import {
    cancelTrialSubscription,
    getActiveCompanySubscriptionByAdmin,
    payCompanySubscription
} from "../controller/subscription.controller.js";
import { registerRateLimiter } from "../config/rate-limiter.js";
import { requireSubscription } from "../middlewares/subscription.middleware.js";
import { validateParams, validateRequest } from "../middlewares/validate.middleware.js";
import {
    changePasswordSchema,
    changeStaffPasswordSchema,
    companySchema,
    createAdminSchema,
    otpVerificationSchema,
    paramsSchema,
    resendOtpSchema,
    resetPasswordSchema,
    staffSchema,
    updateAdminSchema,
    updateStaffSchema
} from "../schemas/request/request.dto.js";

const router = Router();

/* auth admin routes */

// register admin
router.post(
    "/auth/register",
    registerRateLimiter,
    validateRequest(createAdminSchema),
    registerAdmin
);

// verify admin by otp and email field 
router.post(
    "/auth/verify-email",
    validateRequest(otpVerificationSchema),
    verifyAccountByAdmin
);

// resend otp for admin if opt expiry
router.post(
    "/auth/resend-otp",
    validateRequest(resendOtpSchema),
    resendOtpForAdmin
);

// forgot password request
router.post("/auth/forgot-password", forgotPasswordAdmin);

// reset password
router.post(
    "/auth/reset-password",
    validateRequest(resetPasswordSchema),
    resetPasswordForAdmin
);

// change password
router.post(
    "/change-password",
    verifyToken,
    validateRequest(changePasswordSchema),
    changedPasswordForAdmin
);

// update admin by id
router.patch(
    "/:id",
    verifyToken,
    validateParams(paramsSchema),
    validateRequest(updateAdminSchema),
    updateAdmin
);

/* company */
router.post("/companies", verifyToken, validateRequest(companySchema), createCompany);
router.get("/companies", verifyToken, getAllCompaniesByAdmin);
router.get("/companies/:id", verifyToken, getCompany);

// update company
router.patch(
    "/companies/:id",
    verifyToken,
    validateParams(paramsSchema),
    validateRequest(companySchema),
    updateCompany
);

// delete company
router.delete("/companies/:id", verifyToken, validateParams(paramsSchema), deleteCompany);

/* company subscriptions (admin) */
router.get("/companies/:id/subscription", verifyToken, getActiveCompanySubscriptionByAdmin);
router.patch("/companies/:id/subscription/cancel-trial", verifyToken, cancelTrialSubscription);
router.post("/companies/:id/subscription/pay", verifyToken, payCompanySubscription);

/* staff */

// create staff for company
router.post(
    "/staff",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateRequest(staffSchema),
    createStaff
);

// get all staff
router.get(
    "/staff",
    verifyToken,
    requireCompany,
    requireSubscription,
    getAllStaff
);

// get staff by id
router.get(
    "/staff/:id",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateParams(paramsSchema),
    getStaff
);

// change password for staff by admin
router.patch(
    "/staff/:id/change-password",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateParams(paramsSchema),
    validateRequest(changeStaffPasswordSchema),
    changePasswordForStaff
);

// change staff status
router.patch(
    "/staff/:id/status",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateParams(paramsSchema),
    changedStaffStatus
);

// update staff information
router.patch(
    "/staff/:id",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateParams(paramsSchema),
    validateRequest(updateStaffSchema),
    updateStaff
);

// delete staff by admin
router.delete(
    "/staff/:id",
    verifyToken,
    requireCompany,
    requireSubscription,
    validateParams(paramsSchema),
    deleteStaff
);

export default router;