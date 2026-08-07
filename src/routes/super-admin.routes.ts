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
    createSubscriptionPayment,
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
import { validateParams, validateRequest } from "../middlewares/validate.middleware.js";
import { paramsSchema, subscriptionPaymentSchema } from "../schemas/request/request.dto.js";

const router = Router();

/* super admin */
router.post("/auth/logout", verifySuperAdminToken, logoutSuperAdmin);
router.get("/me", verifySuperAdminToken, getMeSuperAdmin);

/* admins*/
router.get("/admins", verifySuperAdminToken, getAllAdmins);
router.get("/admins/:id", verifySuperAdminToken, validateParams(paramsSchema), getAdminById);
router.get("/admins/:id/companies", verifySuperAdminToken, validateParams(paramsSchema), getCompaniesWithAdmin);
router.delete("/admins/:id", verifySuperAdminToken, validateParams(paramsSchema), deleteAdminById);

// change admin status by super admin
router.patch(
    "/admins/:id/status",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    changeAdminStatus
);

/* companies */

// get all companies
router.get("/companies", verifySuperAdminToken, getAllCompaniesBySuperAdmin);

// change or update company status
router.patch(
    "/companies/:id/status",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    changedCompanyStatus
);

/* companies subscription */
router.get("/subscriptions", verifySuperAdminToken, getAllSubscriptions);

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
    getCompanySubscriptions
);

// get active company subscription
router.get(
    "/companies/:id/subscriptions/active",
    verifySuperAdminToken,
    validateParams(paramsSchema),
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
    createSubscriptionPayment
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
    getSubscriptionPayments
);

// get subscription payment by payment id
router.get(
    "/subscriptions/payments/:id", 
    verifySuperAdminToken, 
    validateParams(paramsSchema),
    getSubscriptionByPaymentId
);

// get all subscription related payments
router.get("/subscriptions/payments", verifySuperAdminToken, getAllSubscriptionPayments);

/* notifications */
router.get("/notifications", verifySuperAdminToken, getNotifications);
router.patch("/notifications/read-all", verifySuperAdminToken, updateAllNotificationsReadStatus);
router.patch("/notifications/:id/read", verifySuperAdminToken, updateNotificationReadStatus);

export default router;