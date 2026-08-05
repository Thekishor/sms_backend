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
    createSubscription,
    getActiveCompanySubscriptions,
    getAllSubscriptions,
    getCompanySubscriptions,
    sendReminderMail,
    updateSubscription,
    changeCompanySubscriptionType
} from "../controller/subscription.controller.js";
import {
    createSubscriptionPayment,
    getAllSubscriptionPayments,
    getSubscriptionPayment,
    getSubscriptionPayments
} from "../controller/subscription-payment.controller.js";
import {
    getNotifications,
    updateAllNotificationsReadStatus,
    updateNotificationReadStatus
} from "../controller/notification.controller.js";
import { validateParams } from "../middlewares/validate.middleware.js";
import { paramsSchema } from "../schemas/request/request.dto.js";

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

//change company sub type
router.patch(
    "/companies/:id/subscription-type",
    verifySuperAdminToken,
    validateParams(paramsSchema),
    changeCompanySubscriptionType
);

/* companies subscription */
router.get("/subscriptions", verifySuperAdminToken, getAllSubscriptions);
router.post("/companies/:id/subscriptions", verifySuperAdminToken, createSubscription);

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
router.post("/subscriptions/:id/payments", verifySuperAdminToken, createSubscriptionPayment);
router.get("/subscriptions/:id/payments", verifySuperAdminToken, getSubscriptionPayments);
router.get("/subscriptions/payments/:id", verifySuperAdminToken, getSubscriptionPayment);
router.get("/subscriptions/payments", verifySuperAdminToken, getAllSubscriptionPayments);

/* notifications */
router.get("/notifications", verifySuperAdminToken, getNotifications);
router.patch("/notifications/read-all", verifySuperAdminToken, updateAllNotificationsReadStatus);
router.patch("/notifications/:id/read", verifySuperAdminToken, updateNotificationReadStatus);

export default router;