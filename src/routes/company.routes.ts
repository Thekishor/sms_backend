import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { Role } from "@prisma/client";
import permissionMiddleware from "../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";
import {
    changedStudentStatus,
    createStudent, deleteStudentById,
    getAllStudents,
    getAllStudentsWithPayments,
    getStudentById, getStudentFeeAccount,
    getStudentWithPayments, updateStudentById
} from "../controller/student.controller.js";
import {
    createCourse,
    deleteCourse,
    getAllCourses,
    getAllCoursesWithStudents,
    getCourseById,
    updateCourse
} from "../controller/course.controller.js";
import {
    createFeeForStudent,
    getAllFeeAccounts,
    getFeeAccountById,
} from "../controller/fee-account.controller.js";
import {
    createInventory,
    deleteInventoryById,
    getAllInventories,
    getInventoryById,
    getInventoryStockHistory,
    getStockAlerts,
    getStockSummary,
    issueInventory,
    purchaseInventory,
    updateInventoryById
} from "../controller/inventory.controller.js";
import {
    createPaymentOfStudent,
    getAllPayments,
    getPaymentById
} from "../controller/payment.controller.js";
import {
    createBatch,
    deleteBatch,
    getAllBatches,
    getAllBatchesWithStudents,
    getBatchById,
    updateBatch
} from "../controller/batch.controller.js";
import { requireCompany } from "../middlewares/company.middleware.js";
import {
    changeSupplierStatus,
    createSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSupplier,
    updateSupplier
} from "../controller/supplier.controller.js";
import {
    getAllStockHistory,
    getStockHistory
} from "../controller/stock-history.controller.js";
import { requireSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

/* students routes */

// get all students with payments
router.get("/students/payments",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllStudentsWithPayments
);

// create student
router.post("/students",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    createStudent
);

// get all students
router.get("/students",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllStudents
);

// get student with payments
router.get("/students/:id/payments",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getStudentWithPayments
);

// change student status
router.patch("/students/:id/status",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    changedStudentStatus
);

// get student fee account
router.get("/students/:id/fee-accounts",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getStudentFeeAccount
);

// get student by id
router.get("/students/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getStudentById
);

// update student
router.patch("/students/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    updateStudentById
);

// delete student
router.delete("/students/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    deleteStudentById
);

/* batch routes */

// get all batches with students
router.get("/batches/students",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT, Role.INSTRUCTOR]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllBatchesWithStudents
);

// create batch
router.post("/batches",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    createBatch
);

// get all batches
router.get("/batches",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllBatches
);

// get batch by id
router.get("/batches/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.INSTRUCTOR]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getBatchById
);

// update batch
router.patch("/batches/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    updateBatch
);

// delete batch
router.delete("/batches/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    deleteBatch
);

/* courses routes */

// get all courses with students
router.get("/courses/students",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllCoursesWithStudents
);

// create course
router.post("/courses",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    createCourse
);

// get all courses
router.get("/courses",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.INSTRUCTOR, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllCourses
);

// get course by id
router.get("/courses/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.INSTRUCTOR, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getCourseById
);

// update course
router.patch("/courses/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    updateCourse
);

// delete course
router.delete("/courses/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    deleteCourse
);

/* fee-account routes */

// create fee account
router.post("/fee-accounts",
    verifyToken,
    requireCompany,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    createFeeForStudent
)

//get all fee accounts
router.get("/fee-accounts",
    verifyToken,
    requireCompany,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    getAllFeeAccounts
)

// get fee account by id
router.get("/fee-accounts/:id",
    verifyToken,
    requireCompany,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    getFeeAccountById
)

/* payments routes */

// create payment
router.post("/payments",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    createPaymentOfStudent
);

// get all payments
router.get("/payments",
    verifyToken,
    roleMiddleware([Role.ACCOUNTANT, Role.MANAGER]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getAllPayments
);

// get payment by id
router.get("/payments/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.SMS]),
    requireCompany,
    requireSubscription,
    getPaymentById
);

/* inventory routes */

// create inventory
router.post("/inventory",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    createInventory
);

// get all inventories
router.get("/inventory",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getAllInventories
);

// get stock alerts
router.get("/inventory/alerts",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getStockAlerts
);

// get stock summary
router.get("/inventory/summary",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT, Role.RECEPTIONIST]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getStockSummary
);

// get inventory by id
router.get("/inventory/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.RECEPTIONIST, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getInventoryById
);

// update inventory
router.patch("/inventory/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    updateInventoryById
);

// delete inventory
router.delete("/inventory/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    deleteInventoryById
);

// stock in inventory
router.post("/inventory/:id/stock-in",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    purchaseInventory
);

// stock out inventory
router.post("/inventory/:id/stock-out",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    issueInventory
);

// inventory stock history
router.get("/inventory/:id/stock-history",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getInventoryStockHistory
);

// stock history routes

// get stock history by id
router.get("/inventory/stock-history/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getStockHistory
);

// get all stock history
router.get("/inventory/stock-history",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getAllStockHistory
);

/* supplier routes */

// create supplier
router.post("/suppliers",
    verifyToken,
    roleMiddleware([Role.MANAGER]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    createSupplier
);

// get all suppliers
router.get("/suppliers",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getAllSuppliers
);

// get supplier by id
router.get("/suppliers/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    getSupplier
);

// update supplier
router.patch("/suppliers/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    updateSupplier
);

// change supplier status
router.patch("/suppliers/:id/status",
    verifyToken,
    roleMiddleware([Role.MANAGER, Role.ACCOUNTANT]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    changeSupplierStatus
);

// delete supplier
router.delete("/suppliers/:id",
    verifyToken,
    roleMiddleware([Role.MANAGER]),
    permissionMiddleware([PERMISSIONS.INVENTORY]),
    requireCompany,
    requireSubscription,
    deleteSupplier
);

export default router;