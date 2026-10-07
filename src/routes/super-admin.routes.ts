import { Router } from "express";
import {
    getMeSuperAdmin,
    logoutSuperAdmin
} from "../controller/super-admin.controller.js";
import { verifySuperAdminToken } from "../middlewares/auth.middleware.js";
import {
    changedCompanyStatus,
    getAllCompaniesBySuperAdmin
} from "../controller/company.controller.js";
import {
    changeAdminStatus,
    deleteAdminById,
    getAdminById,
    getAllAdmins,
    getCompaniesWithAdmin
} from "../controller/admin.controller.js";
import {
    getActiveCompanySubscriptions,
    getAllSubscriptions,
    getCompanySubscriptions,
    sendReminderMail,
    updateSubscription,
} from "../controller/subscription.controller.js";
import {
    createPaidSubscription,
    getAllSubscriptionPayments,
    getSubscriptionByPaymentId,
    getSubscriptionPaymentById,
    getSubscriptionPayments
} from "../controller/subscription-payment.controller.js";
import {
    getNotifications,
    updateAllNotificationsReadStatus,
    updateNotificationReadStatus
} from "../controller/notification.controller.js";
import { validateParams, validateQuery, validateRequest } from "../middlewares/validate.middleware.js";
import { paginationSchema, paramsSchema, subscriptionPaymentSchema } from "../schemas/request/request.dto.js";

const router = Router();

/* super admin */

// logout super admin
router.post("/auth/logout", verifySuperAdminToken, logoutSuperAdmin);

// get current logged in information
router.get("/me", verifySuperAdminToken, getMeSuperAdmin);

/* admins*/

// get all admin by super admin
router.get("/admins", verifySuperAdminToken, validateQuery(paginationSchema), getAllAdmins);

// get specific admin by id
router.get("/admins/:id", verifySuperAdminToken, validateParams(paramsSchema), getAdminById);

// get all company with specific admin
router.get("/admins/:id/companies", verifySuperAdminToken, validateParams(paramsSchema), getCompaniesWithAdmin);

// delete admin by super admin only
router.delete("/admins/:id", verifySuperAdminToken, validateParams(paramsSchema), deleteAdminById);

// changing admin status by super admin
router.patch(
    "/admins/:id/status",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    changeAdminStatus
);

/* companies */

// get all companies
router.get("/companies", verifySuperAdminToken, validateQuery(paginationSchema), getAllCompaniesBySuperAdmin);

// change or update company status
router.patch(
    "/companies/:id/status",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    changedCompanyStatus
);

/* companies subscription */

// get all subscription by super admin
router.get("/subscriptions", verifySuperAdminToken, validateQuery(paginationSchema), getAllSubscriptions);

// send subscription reminder mail to company by super admin
router.post(
    "/subscriptions/:id/send-reminder",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    sendReminderMail
);

// get company subscription
router.get(
    "/companies/:id/subscriptions",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    validateQuery(paginationSchema),
    getCompanySubscriptions
);

// get active company subscription
router.get(
    "/companies/:id/subscriptions/active",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    validateQuery(paginationSchema),
    getActiveCompanySubscriptions
);

// cancel subscription
router.patch(
    "/subscriptions/:id/cancel",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    updateSubscription
);

/* company subscription payment */

// create paid subscription after full payment
router.post(
    "/subscriptions/:id/payments",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    validateRequest(subscriptionPaymentSchema),
    createPaidSubscription
);

// get single or latest payment of subscription
router.get(
    "/subscriptions/:id/payments",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    getSubscriptionPaymentById
);

// get all payment records of subscription
router.get(
    "/subscriptions/:id/payments",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    validateQuery(paginationSchema),
    getSubscriptionPayments
);

// get company subscription payment by id
router.get(
    "/subscriptions/payments/:id",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    getSubscriptionByPaymentId
);

// get all subscription related payments
router.get("/subscriptions/payments", verifySuperAdminToken, validateQuery(paginationSchema), getAllSubscriptionPayments);

/* notifications */
router.get("/notifications", verifySuperAdminToken, getNotifications);
router.patch("/notifications/read-all", verifySuperAdminToken, updateAllNotificationsReadStatus);
router.patch("/notifications/:id/read", verifySuperAdminToken, updateNotificationReadStatus);

export default router;