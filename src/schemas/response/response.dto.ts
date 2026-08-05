import { z } from "zod";

export const adminSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    role: z.string(),
    status: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const adminLoginResponseSchema = z.object({
    message: z.string(),
    admin: adminSchema,
    token: z.string(),
});

export const adminResponseSchema = z.object({
    message: z.string(),
    admin: adminSchema,
});

export const adminsResponseSchema = z.object({
    message: z.string(),
    admins: z.array(adminSchema),
    total: z.number(),
});

export const superAdminResponseSchema = z.object({
    message: z.string(),
    superAdmin: z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
        phone: z.string(),
        role: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
    })
});

export const supplierSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    status: z.string(),
    companyId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const supplierResponseSchema = z.object({
    message: z.string(),
    supplier: supplierSchema
});

export const suppliersResponseSchema = z.object({
    message: z.string(),
    suppliers: z.array(supplierSchema),
    total: z.number(),
});

export const staffSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    status: z.string(),
    createdBy: z.string(),
    companyId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const staffResponseSchema = z.object({
    message: z.string(),
    staff: staffSchema,
});

export const staffsResponseSchema = z.object({
    message: z.string(),
    staffs: z.array(staffSchema),
    total: z.number(),
});

export const companySchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    status: z.string(),
    createdBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    subscriptions: z.array(z.object({
        id: z.string(),
        type: z.string(),
        status: z.string(),
        endDate: z.date()
    })).optional()
});

export const companyResponseSchema = z.object({
    message: z.string(),
    company: companySchema,
});

export const companiesResponseSchema = z.object({
    message: z.string(),
    companies: z.array(companySchema),
    total: z.number(),
});

export const studentSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    status: z.string(),
    guardianName: z.string(),
    guardianPhone: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    joiningDate: z.date(),
    batchId: z.string(),
    courseId: z.string(),
    companyId: z.string(),
});

export const studentResponseSchema = z.object({
    message: z.string(),
    student: studentSchema,
});

export const studentsResponseSchema = z.object({
    message: z.string(),
    students: z.array(studentSchema),
    total: z.number(),
})

export const paymentSchema = z.object({
    id: z.string(),
    amount: z.string(),
    date: z.date(),
    description: z.string().nullable(),
    studentId: z.string(),
    companyId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const feeAccountSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    companyId: z.string(),
    totalFee: z.string(),
    discountType: z.string(),
    discountValue: z.string(),
    discountNote: z.string().nullable(),
    finalFee: z.string(),
    paid: z.string(),
    remainingAmount: z.string(),
    paymentPlan: z.string(),
    paymentStatus: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const feeAccountResponseSchema = z.object({
    message: z.string(),
    feeAccount: feeAccountSchema,
})

export const feeAccountsResponseSchema = z.object({
    message: z.string(),
    feeAccounts: z.array(feeAccountSchema),
    total: z.number(),
})

export const paymentResponseSchema = z.object({
    message: z.string(),
    payment: paymentSchema,
})

export const paymentsResponseSchema = z.object({
    message: z.string(),
    payments: z.array(paymentSchema),
    total: z.number(),
})

export const studentWithPaymentsSchema = z.object({
    message: z.string(),
    student: studentSchema.extend({
        payments: z.array(paymentSchema),
    })
})

export const studentsWithPaymentsSchema = z.object({
    message: z.string(),
    students: z.array(
        studentSchema.extend({
            payments: z.array(paymentSchema),
        })
    ),
    total: z.number(),
})

export const studentWithFeeAccountSchema = z.object({
    message: z.string(),
    student: studentSchema.extend({
        feeAccount: feeAccountSchema.nullable(),
    })
})

export const inventorySchema = z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    quantity: z.number(),
    description: z.string().nullable(),
    minStock: z.number(),
    measures: z.string(),
    companyId: z.string(),
    createdBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const inventoryResponseSchema = z.object({
    message: z.string(),
    inventory: inventorySchema,
})

export const inventoriesResponseSchema = z.object({
    message: z.string(),
    inventories: z.array(inventorySchema),
    total: z.number(),
})

export const courseSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.string(),
    duration: z.string(),
    description: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    companyId: z.string(),
});

export const stockHistorySchema = z.object({
    id: z.string(),
    inventoryId: z.string(),
    type: z.string(),
    reason: z.string(),
    quantity: z.number(),
    remarks: z.string().nullable(),
    companyId: z.string(),
    createdBy: z.string(),
    batchId: z.string(),
    createdAt: z.date(),
});

export const courseResponseSchema = z.object({
    message: z.string(),
    course: courseSchema,
});

export const coursesResponseSchema = z.object({
    message: z.string(),
    courses: z.array(courseSchema),
    total: z.number(),
});

export const coursesWithStudentsResponseSchema = z.object({
    message: z.string(),
    courses: z.array(
        courseSchema.extend({
            students: z.array(studentSchema),
        })
    ),
    total: z.number(),
});

export const batchSchema = z.object({
    id: z.string(),
    name: z.string(),
    startDate: z.date(),
    capacity: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    companyId: z.string(),
})

export const batchResponseSchema = z.object({
    message: z.string(),
    batch: batchSchema,
})

export const batchesResponseSchema = z.object({
    message: z.string(),
    batches: z.array(batchSchema),
    total: z.number(),
})

export const batchesWithStudentsResponseSchema = z.object({
    message: z.string(),
    batches: z.array(
        batchSchema.extend({
            students: z.array(studentSchema),
        })
    ),
    total: z.number(),
})

export const adminWithCompaniesResponseSchema = z.object({
    message: z.string(),
    admin: adminSchema.extend({
        companies: z.array(companySchema)
    })
})

export const stockHistoryResponse = z.object({
    message: z.string(),
    stockHistory: stockHistorySchema
});

export const stockHistoriesResponse = z.object({
    message: z.string(),
    stockHistories: z.array(stockHistorySchema),
    total: z.number()
});

export const inventoryWithStockHistoryResponse = z.object({
    message: z.string(),
    inventory: inventorySchema,
    stockHistory: stockHistorySchema
})

export const inventoryBatchSchema = z.object({
    id: z.string(),
    batchNumber: z.string(),
    inventoryId: z.string(),
    supplierId: z.string(),
    quantity: z.number(),
    remainingQty: z.number(),
    purchasePrice: z.string(),
    purchaseDate: z.date(),
    totalPrice: z.string(),
    companyId: z.string(),
    expiryDate: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const purchaseInventorySchema = z.object({
    message: z.string(),
    purchaseInventory: z.object({
        inventory: inventorySchema,
        inventoryBatch: inventoryBatchSchema,
        stockHistory: stockHistorySchema
    })
})

export const issueInventorySchema = z.object({
    message: z.string(),
    issueInventory: z.object({
        inventory: inventorySchema,
        deductions: z.array(z.any()),
        stockHistories: z.array(stockHistorySchema)
    })
})

export const stockAlertsSchema = z.object({
    message: z.string(),
    stockAlerts: z.object({
        expiringSoon: z.array(inventoryBatchSchema),
        expired: z.array(inventoryBatchSchema),
        lowStock: z.array(inventorySchema),
        noExpiry: z.array(inventoryBatchSchema),
        outOfStock: z.array(inventorySchema)
    })
})

export const stockSummarySchema = z.object({
    message: z.string(),
    stockSummary: z.object({
        totalInventory: z.number(),
        totalSuppliers: z.number(),
        outOfStock: z.number(),
        lowStock: z.number(),
        totalBatch: z.number(),
        totalStockHistory: z.number()
    })
})

export const subscriptionSchema = z.object({
    id: z.string(),
    companyId: z.string(),
    type: z.string(),
    duration: z.number(),
    startDate: z.date(),
    endDate: z.date(),
    amount: z.string(),
    paymentStatus: z.string(),
    status: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const subscriptionResponseSchema = z.object({
    message: z.string(),
    subscription: subscriptionSchema
});

export const subscriptionsResponseSchema = z.object({
    message: z.string(),
    subscriptions: z.array(subscriptionSchema),
    total: z.number()
});

export const subscriptionPaymentSchema = z.object({
    id: z.string(),
    subscriptionId: z.string(),
    amount: z.string(),
    paymentDate: z.date(),
    paymentMethod: z.string(),
    referenceNumber: z.string().nullable(),
    status: z.string(),
    verifiedBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const subscriptionPaymentResponseSchema = z.object({
    message: z.string(),
    subscriptionPayment: subscriptionPaymentSchema
});

export const subscriptionPaymentsResponseSchema = z.object({
    message: z.string(),
    subscriptionPayments: z.array(subscriptionPaymentSchema),
    total: z.number()
});

export type AdminResponseDto = z.infer<typeof adminResponseSchema>;
export type AdminsResponseDto = z.infer<typeof adminsResponseSchema>;
export type AdminWithCompaniesResponseDto = z.infer<typeof adminWithCompaniesResponseSchema>;
export type SuperAdminResponseDto = z.infer<typeof superAdminResponseSchema>;
export type StaffResponseDto = z.infer<typeof staffResponseSchema>;
export type StaffsResponseDto = z.infer<typeof staffsResponseSchema>;
export type CompanyResponseDto = z.infer<typeof companyResponseSchema>;
export type CompaniesResponseDto = z.infer<typeof companiesResponseSchema>;
export type StudentResponseDto = z.infer<typeof studentResponseSchema>;
export type StudentsResponseDto = z.infer<typeof studentsResponseSchema>;
export type PaymentResponseDto = z.infer<typeof paymentResponseSchema>;
export type PaymentsResponseDto = z.infer<typeof paymentsResponseSchema>;
export type StudentWithPaymentsResponseDto = z.infer<typeof studentWithPaymentsSchema>;
export type StudentsWithPaymentsResponseDto = z.infer<typeof studentsWithPaymentsSchema>;
export type StudentWithFeeAccountResponseDto = z.infer<typeof studentWithFeeAccountSchema>;
export type InventoryResponseDto = z.infer<typeof inventoryResponseSchema>;
export type InventoriesResponseDto = z.infer<typeof inventoriesResponseSchema>;
export type FeeAccountResponseDto = z.infer<typeof feeAccountResponseSchema>;
export type FeeAccountsResponseDto = z.infer<typeof feeAccountsResponseSchema>;
export type CourseResponseDto = z.infer<typeof courseResponseSchema>;
export type CoursesResponseDto = z.infer<typeof coursesResponseSchema>;
export type CoursesWithStudentsResponseDto = z.infer<typeof coursesWithStudentsResponseSchema>;
export type BatchResponseDto = z.infer<typeof batchResponseSchema>;
export type BatchesResponseDto = z.infer<typeof batchesResponseSchema>;
export type BatchesWithStudentsResponseDto = z.infer<typeof batchesWithStudentsResponseSchema>;
export type SupplierResponseDto = z.infer<typeof supplierResponseSchema>;
export type SuppliersResponseDto = z.infer<typeof suppliersResponseSchema>;
export type StockHistoryResponseDto = z.infer<typeof stockHistoryResponse>;
export type StockHistoriesResponseDto = z.infer<typeof stockHistoriesResponse>;
export type PurchaseInventoryDto = z.infer<typeof purchaseInventorySchema>;
export type IssueInventoryDto = z.infer<typeof issueInventorySchema>;
export type StockAlertsDto = z.infer<typeof stockAlertsSchema>;
export type StockSummaryDto = z.infer<typeof stockSummarySchema>;
export type SubscriptionResponseDto = z.infer<typeof subscriptionResponseSchema>;
export type SubscriptionsResponseDto = z.infer<typeof subscriptionsResponseSchema>;
export type SubscriptionPaymentResponseDto = z.infer<typeof subscriptionPaymentResponseSchema>;
export type SubscriptionPaymentsResponseDto = z.infer<typeof subscriptionPaymentsResponseSchema>;