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
    id: z.string().min(1, "Request params is required")
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
        example: "kishorpandey981@gmail.com"
    });

const nameField = z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .openapi({
        example: "Kishor Pandey"
    });

const phoneField = z
    .string()
    .min(1, "Phone number is required")
    .transform(val => val.trim().replaceAll(/[\s-]/g, ""))
    .refine(val => phoneRegex.test(val), {
        message: "Invalid phone number",
    })
    .openapi({
        example: "9865432109"
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
        example: "Kishor@123"
    });

const rolesField = z.array(RoleSchema)
    .min(1, "At least one role is required")
    .openapi({
        example: ["MANAGER", "ACCOUNTANT", "RECEPTIONIST", "INSTRUCTOR"]
    });

const permissionsField = z.array(PermissionSchema)
    .min(1, "At least one permission is required")
    .openapi({
        example: ["SMS", "INVENTORY"]
    });

const addressField = z
    .string()
    .trim()
    .min(5, "Address is required")
    .openapi({
        example: "Tilottama-4, Rupandehi"
    });

const amountField = z.coerce.number()
    .positive("Amount must be greater than 0").openapi({
        example: "5000"
    });

const descriptionField = z
    .string()
    .trim()
    .min(10, "Description must be at least 10")
    .max(100, "Description must be at least 50")
    .openapi({
        example: "Please type or write short description about this field."
    });

const otpField = z
    .string()
    .trim()
    .min(6, "Otp is required")
    .openapi({
        example: "857458"
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
            example: "kishorpandey981@gmail.com or 9865432109"
        }),

    password: z.string().min(1, "Password is required")
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
        example: "kishor techno consultancy pvt. ltd."
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
        example: "Kishor@123"
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
            example: "EMAIL_VERIFICATION or PASSWORD_RESET"
        })
});

export const changePasswordSchema = z.object({
    oldPassword: passwordField.openapi({
        example: "Kishor@123",
    }),
    newPassword: passwordField.openapi({
        example: "Kishor@1234",
    }),
    confirmPassword: z.string().openapi({
        example: "Kishor@1234"
    })
}).refine((val) =>
    val.newPassword === val.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"]
});

export const changeStaffPasswordSchema = z.object({
    newPassword: passwordField.openapi({
        example: "Kishor@1234",
    }),
    confirmPassword: z.string().openapi({
        example: "Kishor@1234"
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
        example: "9868786543"
    }),
    joiningDate: z.coerce.date().openapi({
        example: "2026-01-01"
    }),
    batchId: z
        .string()
        .trim()
        .min(1, "Batch Id is required")
        .openapi({
            example: "01KV207DBJJ5HT40BPVCAW5X6Z"
        }),
    courseId: z
        .string()
        .trim()
        .min(1, "Course Id is required")
        .openapi({
            example: "019ec404-0bb1-71e3-ae4d-c020fad6cab5"
        }),
})

export const studentUpdateSchema = z.object({
    fullName: nameField,
    email: emailField.openapi({
        example: "kishorpandey981@gmail.com"
    }),
    phone: phoneField.openapi({
        example: "9840001234"
    }),
    address: addressField,
    guardianName: nameField.openapi({
        example: "Ram Pandey"
    }),
    guardianPhone: phoneField.openapi({
        example: "9840003400"
    }),
})

export const batchSchema = z.object({
    name: nameField.openapi({
        example: "FullStack-2026-B01-EVN"
    }),
    startDate: z.coerce.date().openapi({
        example: "2026-01-01"
    }),
    capacity: z
        .number()
        .min(1, "Capacity must be at least 1")
        .max(100, "Capacity cannot exceed 100")
        .openapi({
            example: 30
        }),
})

export const courseSchema = z.object({
    name: nameField.openapi({
        example: "Full Stack Development",
    }),
    price: amountField,
    duration: z.string()
        .min(1, "Course duration is required")
        .openapi({
            example: "45"
        }),
    description: descriptionField.openapi({
        example: "Full stack developer with html, css, js and node js",
    })
})

export const inventorySchema = z.object({
    name: nameField.openapi({
        example: "Desktop"
    }),
    minStock: z.coerce.number()
        .int()
        .openapi({
            example: 10
        }),
    measures: z.enum(UnitOfMeasure)
        .openapi({
            example: "PIECE, BOX, PACK, DOZEN, KILOGRAM, GRAM, TON, LITER, MILLILITER, METER, or CENTIMETER"
        }),
    description: descriptionField.openapi({
        example: "Hp Victus Desktop"
    })
});

export const paymentSchema = z.object({
    amount: amountField,
    date: z.coerce.date().openapi({
        example: "2026-01-01"
    }),
    description: descriptionField,
    studentId: z.string()
        .min(1, "Student id is required")
        .openapi({
            example: "01KV20AYPTKWBJQTMTKA4Q340Y"
        }),
});

export const feeAccountSchema = z.object({
    studentId: z.string()
        .min(1, "Student id is required")
        .openapi({
            example: "01KV20AYPTKWBJQTMTKA4Q340Y"
        }),
    discountType: z.enum(DiscountType).openapi({
        example: "PERCENT or FIXED"
    }),
    discountValue: amountField,
    discountNote: z.string()
        .min(1, "Discount note is required")
        .max(100, "Discount note cannot exceed 100")
        .openapi({
            example: "Dashain festival discount"
        }),
    paymentPlan: z.enum(PaymentPlan)
        .openapi({
            example: "INSTALLMENT, ADVANCE, or FULL"
        }),
    paymentStatus: z.enum(PaymentStatus)
        .openapi({
            example: "DUE, PARTIAL, or PAID"
        }),
})

export const supplierSchema = z.object({
    name: nameField.openapi({
        example: "kishor computer and techno shop"
    }),
    email: emailField,
    phone: phoneField,
    address: addressField
})

export const purchaseStockSchema = z.object({
    supplierId: z.string()
        .min(1, "Supplier Id is required")
        .openapi({
            example: "019ec404-9983-7dee-b84d-8edfc25a561e"
        }),
    quantity: z.coerce
        .number().positive()
        .min(1, "Quantity is required").openapi({
            example: "50"
        }),
    purchasePrice: z.coerce.string()
        .openapi({
            example: "5000"
        }),
    reason: z.enum(StockMovementReason).openapi({
        example: "PURCHASE or ISSUE or RETURN or DAMAGE or LOST or MANUAL_ADJUSTMENT"
    }),
    expiryDate: z.coerce.date().optional().openapi({
        example: "2026-06-03"
    }),
    remarks: descriptionField

})

export const stockOutSchema = z.object({
    reason: z.enum(StockMovementReason).openapi({
        example: "PURCHASE or ISSUE or RETURN or DAMAGE or LOST or MANUAL_ADJUSTMENT"
    }),
    quantity: z.coerce
        .number().positive()
        .min(1, "Quantity is required").openapi({
            example: "50"
        }),
    remarks: descriptionField

})

export const subscriptionSchema = z.object({
    type: z.enum(SubscriptionType).openapi({
        example: "TRIAL or PAID"
    }),
    startDate: z.coerce.date().openapi({
        example: "2026-06-03"
    }),
    endDate: z.coerce.date().openapi({
        example: "2026-08-30"
    }),
    amount: z.coerce.number().min(0, "Amount cannot be negative"),
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
        example: "CASH or BANK_TRANSFER or QR or CHEQUE or OTHER"
    }),
    referenceNumber: z.string().optional().openapi({
        example: "20260706B1Q0001C002345"
    }),
    remarks: descriptionField
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
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