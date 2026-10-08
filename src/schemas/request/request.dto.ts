import { z } from "zod";
import {
    DiscountType,
    OtpType,
    PaymentMethod,
    PaymentPlan,
    PaymentStatus,
    Role,
    StockMovementReason,
    SubscriptionType,
    UnitOfMeasure
} from "@prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { PERMISSIONS } from "../../utils/permissions.js";

extendZodWithOpenApi(z);

const RoleSchema = z.enum(Role).exclude([Role.ADMIN]);
const PermissionSchema = z.enum(Object.values(PERMISSIONS));

const phoneRegex = /^(97[01456]|98[012456])\d{7}$/;

const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;

export const paramsSchema = z.object({
    id: z.string().min(1, "Request params is required").openapi({
        type: "string",
        example: "01a11a75-d8da-777c-bc4d-d379ee1ca3f1",
        description: "Enter valid request params"
    })
});

const emailField = z
    .string()
    .trim()
    .min(1, "Email address is required")
    .refine((val) => z.email().safeParse(val).success, {
        message: "Invalid email address",
    })
    .transform(email => email.toLowerCase())
    .openapi({
        type: "string",
        example: "kishorpandey981@gmail.com",
        description: "Enter valid email address"
    });

const nameField = z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .openapi({
        type: "string",
        example: "Kishor Pandey",
        description: "Enter valid name"
    });

const phoneField = z
    .string()
    .min(1, "Phone number is required")
    .transform(val => val.trim().replaceAll(/[\s-]/g, ""))
    .refine(val => phoneRegex.test(val), {
        message: "Invalid phone number",
    })
    .openapi({
        type: "string",
        example: "9865432109",
        description: "Enter phone number"
    });

const passwordField = z
    .string()
    .superRefine((value, ctx) => {
        if (value.length < 8 || value.length > 20) {
            ctx.addIssue({
                code: "custom",
                message: "Password must be between 8 and 20 characters.",
            });
            return;
        }

        if (!passwordRegex.test(value)) {
            ctx.addIssue({
                code: "custom",
                message: "Password must include an uppercase letter, lowercase letter, number, and special character.",
            });
        }
    }).openapi({
        type: "string",
        example: "Kishor@123",
        description: "Enter your password"
    });

const rolesField = z.array(RoleSchema)
    .min(1, "At least one role is required")
    .openapi({
        type: "array",
        example: ["MANAGER", "ACCOUNTANT", "RECEPTIONIST", "INSTRUCTOR"],
        description: "Enter valid roles"
    });

const permissionsField = z.array(PermissionSchema)
    .min(1, "At least one permission is required")
    .openapi({
        type: "array",
        example: ["SMS", "INVENTORY"],
        description: "Enter valid permissions"
    });

const addressField = z
    .string()
    .trim()
    .min(1, "Address is required")
    .openapi({
        type: "string",
        example: "Tilottama-4, Rupandehi",
        description: "Enter valid address"
    });

const amountField = z.coerce.number()
    .positive("Amount must be greater than 0").openapi({
        type: "number",
        example: "5000",
        description: "Enter valid amount"
    });

const descriptionField = z
    .string()
    .trim()
    .min(10, "Description must be at least 10")
    .max(100, "Description must be at least 50")
    .openapi({
        type: "string",
        example: "sms service for students",
        description: "Enter valid description"
    });

const otpField = z
    .string()
    .trim()
    .min(6, "Otp is required")
    .openapi({
        type: "string",
        example: "857458",
        description: "Enter valid OTP"
    });

export const loginSchema = z.object({
    loginIdentifier: z
        .string()
        .trim()
        .min(1, "Email or phone is required")
        .refine(
            (val) => {
                const isEmail = z.email().safeParse(val).success;
                const isPhone = phoneRegex.test(val);

                return isEmail || isPhone;
            },
            {
                message: "Invalid email or phone number",
            }
        )
        .openapi({
            type: "string",
            example: "kishorpandey981@gmail.com or 9865432109",
            description: "Email address or phone number"
        }),

    password: z.string().min(1, "Password is required").openapi({
        type: "string",
        example: "Kishor@123",
        description: "Enter your password"
    })
});

export const createAdminSchema = z.object({
    fullName: nameField,
    email: emailField,
    phone: phoneField,
    address: addressField,
    password: passwordField
});

export const updateAdminSchema = z.object({
    fullName: nameField,
    address: addressField
});

export const companySchema = z.object({
    name: nameField.openapi({
        type: "string",
        example: "kishor techno consultancy pvt. ltd.",
        description: "Enter valid company name"
    }),
    email: emailField,
    phone: phoneField,
    address: addressField,
});

export const staffSchema = z.object({
    fullName: nameField,
    email: emailField,
    password: passwordField,
    phone: phoneField,
    address: addressField,
    roles: rolesField,
    permissions: permissionsField
});

export const updateStaffSchema = z.object({
    fullName: nameField,
    email: emailField,
    phone: phoneField,
    address: addressField,
    roles: rolesField,
    permissions: permissionsField
});

export const otpVerificationSchema = z.object({
    email: emailField,
    otp: otpField
});

export const resetPasswordSchema = z.object({
    email: emailField,
    otp: otpField,
    newPassword: passwordField,
    confirmPassword: z.string().openapi({
        type: "string",
        example: "Kishor@123",
        description: "Confirm your new password"
    })
}).refine((val) =>
    val.newPassword === val.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"]
}
);

export const resendOtpSchema = z.object({
    email: emailField,
    type: z.enum([OtpType.EMAIL_VERIFICATION, OtpType.PASSWORD_RESET])
        .openapi({
            type: "array",
            example: "EMAIL_VERIFICATION or PASSWORD_RESET",
            description: "Enter valid otp type"
        })
});

export const changePasswordSchema = z.object({
    oldPassword: passwordField.openapi({
        type: "string",
        example: "Kishor@123",
        description: "Enter your current password"
    }),
    newPassword: passwordField.openapi({
        type: "string",
        example: "Kishor@1234",
        description: "Enter your new password"
    }),
    confirmPassword: z.string().openapi({
        type: "string",
        example: "Kishor@1234",
        description: "Confirm your new password"
    })
}).refine((val) =>
    val.newPassword === val.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"]
});

export const changeStaffPasswordSchema = z.object({
    newPassword: passwordField.openapi({
        type: "string",
        example: "Kishor@1234",
        description: "Enter your new password"
    }),
    confirmPassword: z.string().openapi({
        type: "string",
        example: "Kishor@1234",
        description: "Confirm your new password"
    })
}).refine((val) =>
    val.newPassword === val.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"]
});

export const studentSchema = z.object({
    fullName: nameField,
    email: emailField,
    phone: phoneField,
    address: addressField,
    guardianName: nameField.openapi({
        example: "Ram Pandey"
    }),
    guardianPhone: phoneField.openapi({
        type: "string",
        example: "9868786543",
        description: "Enter valid guardian phone number"
    }),
    joiningDate: z.coerce.date().openapi({
        type: "string",
        example: "2026-01-01",
        description: "Enter valid joining date"
    }),
    batchId: z
        .string()
        .trim()
        .min(1, "Batch Id is required")
        .openapi({
            type: "string",
            example: "01KV207DBJJ5HT40BPVCAW5X6Z",
            description: "Enter valid batch id"
        }),
    courseId: z
        .string()
        .trim()
        .min(1, "Course Id is required")
        .openapi({
            type: "string",
            example: "019ec404-0bb1-71e3-ae4d-c020fad6cab5",
            description: "Enter valid course id"
        }),
})

export const studentUpdateSchema = z.object({
    fullName: nameField,
    email: emailField.openapi({
        type: "string",
        example: "kishorpandey981@gmail.com",
        description: "Enter valid email address"
    }),
    phone: phoneField.openapi({
        type: "string",
        example: "9840001234",
        description: "Enter valid phone number"
    }),
    address: addressField,
    guardianName: nameField.openapi({
        type: "string",
        example: "Ram Pandey",
        description: "Enter valid guardian name"
    }),
    guardianPhone: phoneField.openapi({
        type: "string",
        example: "9840003400",
        description: "Enter valid guardian phone number"
    }),
})

export const batchSchema = z.object({
    name: nameField.openapi({
        type: "string",
        example: "FullStack-2026-B01-EVN",
        description: "Enter valid batch name"
    }),
    startDate: z.coerce.date().openapi({
        type: "string",
        example: "2026-01-01",
        description: "Enter valid start date"
    }),
    capacity: z
        .number()
        .min(1, "Capacity must be at least 1")
        .max(100, "Capacity cannot exceed 100")
        .openapi({
            type: "number",
            example: 30,
            description: "Enter valid batch capacity"
        }),
})

export const courseSchema = z.object({
    name: nameField.openapi({
        type: "string",
        example: "Full Stack Development",
        description: "Enter valid course name"
    }),
    price: amountField,
    duration: z.string()
        .min(1, "Course duration is required")
        .openapi({
            type: "string",
            example: "45",
            description: "Enter valid course duration"
        }),
    description: descriptionField.openapi({
        type: "string",
        example: "Full stack development",
        description: "Enter valid course description"
    })
})

export const inventorySchema = z.object({
    name: nameField.openapi({
        type: "string",
        example: "Desktop",
        description: "Enter valid inventory name"
    }),
    minStock: z.coerce.number()
        .int()
        .openapi({
            type: "number",
            example: 10,
            description: "Enter valid minimum stock level"
        }),
    measures: z.enum(UnitOfMeasure)
        .openapi({
            type: "string",
            example: "PIECE, BOX, PACK, DOZEN, KILOGRAM, GRAM, TON, LITER, MILLILITER, METER, or CENTIMETER",
            description: "Select valid unit of measure"
        }),
    description: descriptionField.openapi({
        type: "string",
        example: "Hp Victus Desktop",
        description: "Enter valid inventory description"
    })
});

export const paymentSchema = z.object({
    amount: amountField,
    date: z.coerce.date().openapi({
        type: "string",
        example: "2026-01-01",
        description: "Enter valid payment date"
    }),
    description: descriptionField,
    studentId: z.string()
        .min(1, "Student id is required")
        .openapi({
            type: "string",
            example: "01KV20AYPTKWBJQTMTKA4Q340Y",
            description: "Enter valid student id"
        }),
});

export const feeAccountSchema = z.object({
    studentId: z.string()
        .min(1, "Student id is required")
        .openapi({
            type: "string",
            example: "01KV20AYPTKWBJQTMTKA4Q340Y",
            description: "Enter valid student id"
        }),
    discountType: z.enum(DiscountType).openapi({
        type: "string",
        example: "PERCENT or FIXED",
        description: "Select valid discount type"
    }),
    discountValue: amountField,
    discountNote: z.string()
        .min(1, "Discount note is required")
        .max(100, "Discount note cannot exceed 100")
        .openapi({
            type: "string",
            example: "Dashain festival discount",
            description: "Enter valid discount note"
        }),
    paymentPlan: z.enum(PaymentPlan)
        .openapi({
            type: "string",
            example: "INSTALLMENT, ADVANCE, or FULL",
            description: "Select valid payment plan"
        }),
    paymentStatus: z.enum(PaymentStatus)
        .openapi({
            type: "string",
            example: "DUE, PARTIAL, or PAID",
            description: "Select valid payment status"
        }),
})

export const supplierSchema = z.object({
    name: nameField.openapi({
        type: "string",
        example: "kishor computer and techno shop",
        description: "Enter valid supplier name"
    }),
    email: emailField,
    phone: phoneField,
    address: addressField
})

export const purchaseStockSchema = z.object({
    supplierId: z.string()
        .min(1, "Supplier Id is required")
        .openapi({
            type: "string",
            example: "019ec404-9983-7dee-b84d-8edfc25a561e",
            description: "Enter valid supplier id"
        }),
    quantity: z.coerce
        .number().positive()
        .min(1, "Quantity is required").openapi({
            type: "number",
            example: "50",
            description: "Enter valid quantity"
        }),
    purchasePrice: z.coerce.string()
        .openapi({
            type: "string",
            example: "5000",
            description: "Enter valid purchase price"
        }),
    reason: z.enum(StockMovementReason).openapi({
        type: "string",
        example: "PURCHASE or ISSUE or RETURN or DAMAGE or LOST or MANUAL_ADJUSTMENT",
        description: "Select valid reason for stock movement"
    }),
    expiryDate: z.coerce.date().optional().openapi({
        type: "string",
        example: "2026-06-03",
        description: "Enter valid expiry date"
    }),
    remarks: descriptionField

})

export const stockOutSchema = z.object({
    reason: z.enum(StockMovementReason).openapi({
        type: "string",
        example: "PURCHASE or ISSUE or RETURN or DAMAGE or LOST or MANUAL_ADJUSTMENT",
        description: "Select valid reason for stock movement"
    }),
    quantity: z.coerce
        .number().positive()
        .min(1, "Quantity is required").openapi({
            type: "number",
            example: "50",
            description: "Enter valid quantity"
        }),
    remarks: descriptionField

})

export const subscriptionSchema = z.object({
    type: z.enum(SubscriptionType).openapi({
        type: "string",
        example: "TRIAL or PAID",
        description: "Select valid subscription type"
    }),
    startDate: z.coerce.date().openapi({
        type: "string",
        example: "2026-06-03",
        description: "Enter valid start date"
    }),
    endDate: z.coerce.date().openapi({
        type: "string",
        example: "2026-08-30",
        description: "Enter valid end date"
    }),
    amount: z.coerce.number().min(0, "Amount cannot be negative").openapi({
        type: "number",
        example: "5000",
        description: "Enter valid amount"
    }),
    remarks: descriptionField

})

export const subscriptionPaymentSchema = z.object({
    month: z.coerce
        .number()
        .int("Month must be a whole number.")
        .min(1, "Minimum subscription duration is 1 month.")
        .max(12, "Maximum subscription duration is 12 months."),
    amount: amountField,
    paymentMethod: z.enum(PaymentMethod).openapi({
        type: "string",
        example: "CASH or BANK_TRANSFER or QR or CHEQUE or OTHER",
        description: "Select valid payment method"
    }),
    referenceNumber: z.string().optional().openapi({
        type: "string",
        example: "20260706B1Q0001C002345",
        description: "Enter valid reference number"
    }),
    remarks: descriptionField
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().default(""),
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type ParamSchema = z.infer<typeof paramsSchema>;
export type CreateAdminDto = z.infer<typeof createAdminSchema>;
export type UpdateAdminDto = z.infer<typeof updateAdminSchema>;
export type CompanyDto = z.infer<typeof companySchema>;
export type StaffDto = z.infer<typeof staffSchema>;
export type OTPVerificationDto = z.infer<typeof otpVerificationSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ChangeStaffPasswordDto = z.infer<typeof changeStaffPasswordSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
export type StudentDto = z.infer<typeof studentSchema>;
export type StudentUpdateDto = z.infer<typeof studentUpdateSchema>;
export type BatchDto = z.infer<typeof batchSchema>;
export type CourseDto = z.infer<typeof courseSchema>;
export type InventoryDto = z.infer<typeof inventorySchema>;
export type PaymentDto = z.infer<typeof paymentSchema>;
export type FeeAccountDto = z.infer<typeof feeAccountSchema>;
export type SupplierDto = z.infer<typeof supplierSchema>;
export type PurchaseStockDto = z.infer<typeof purchaseStockSchema>;
export type StockOutDto = z.infer<typeof stockOutSchema>;
export type SubscriptionDto = z.infer<typeof subscriptionSchema>;
export type SubscriptionPaymentDto = z.infer<typeof subscriptionPaymentSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;