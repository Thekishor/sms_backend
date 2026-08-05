import {
    OpenAPIRegistry,
    OpenApiGeneratorV3
} from "@asteasolutions/zod-to-openapi";
import { z } from 'zod';
import {
    createAdminSchema,
    loginSchema,
    otpVerificationSchema,
    resendOtpSchema,
    resetPasswordSchema,
    changePasswordSchema, updateAdminSchema,
    staffSchema, updateStaffSchema, studentSchema,
    studentUpdateSchema, inventorySchema,
    feeAccountSchema, courseSchema, batchSchema,
    paymentSchema, companySchema,
    supplierSchema,
    stockOutSchema,
    purchaseStockSchema,
    subscriptionSchema,
    subscriptionPaymentSchema
} from "../schemas/request/request.dto.js";
import {
    adminLoginResponseSchema,
    adminResponseSchema,
    adminsResponseSchema, adminWithCompaniesResponseSchema,
    batchesResponseSchema,
    batchesWithStudentsResponseSchema, batchResponseSchema,
    companiesResponseSchema,
    companyResponseSchema,
    courseResponseSchema,
    coursesResponseSchema,
    coursesWithStudentsResponseSchema, feeAccountResponseSchema,
    feeAccountsResponseSchema, inventoriesResponseSchema,
    inventoryResponseSchema, issueInventorySchema,
    paymentResponseSchema, paymentsResponseSchema,
    purchaseInventorySchema, staffResponseSchema,
    staffsResponseSchema,
    stockAlertsSchema,
    stockHistoriesResponse,
    stockHistoryResponse,
    stockSummarySchema,
    studentResponseSchema, studentsResponseSchema,
    studentsWithPaymentsSchema,
    studentWithFeeAccountSchema,
    studentWithPaymentsSchema, subscriptionPaymentResponseSchema,
    subscriptionPaymentsResponseSchema, subscriptionResponseSchema,
    subscriptionsResponseSchema, superAdminResponseSchema,
    supplierResponseSchema,
    suppliersResponseSchema
} from "../schemas/response/response.dto.js";
import { Status } from "@prisma/client";

const registry = new OpenAPIRegistry();

const idParamSchema = z.object({
    id: z.string().openapi({
        example: "01f0e55c3-c3d8-762a-bfc2-bd11bc99a48d"
    }),
})

const companyIdSchema = z.object({
    id: z.string().openapi({
        example: "019ec407-11a0-70d4-b558-5c7ec9a218d0"
    })
});

const subscriptionIdSchema = z.object({
    id: z.string().openapi({
        example: "020ec417-44a0-45d7-b678-5e7ad9e229e2"
    })
});

const subscriptionPaymentIdSchema = z.object({
    id: z.string().openapi({
        example: "l8vnkvku6rrwyse0e8ke4b80"
    })
});

const statusSchema = z.object({
    status: z.enum(Status).openapi({
        example: "ACTIVE or INACTIVE or REJECTED"
    }),
});

registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
});

/*swagger open api (zod) docs for sms backend application*/

// login all 
registry.registerPath({
    method: "post",
    path: "/api/v1/auth/login",

    tags: ["Auth Routes"],
    summary: "Login SuperAdmin, Admin and Staff",
    description: "Authenticate user (super admin, admin, or staff) and return a JWT token.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: loginSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Login successfully",
            content: {
                "application/json": {
                    schema: adminLoginResponseSchema
                }
            }
        }
    }
});

// generate new tokens (access + refresh token)
registry.registerPath({
    method: "post",
    path: "/api/v1/auth/refresh-token",

    tags: ["Auth Routes"],
    summary: "Refresh Token for Admin or Staff ",
    description: "Generate new access and refresh tokens for an authenticated admin or staff.",
    responses: {
        200: {
            description: "Tokens generated successfully",
            content: {
                "application/json": {
                    schema: adminLoginResponseSchema
                }
            }
        }
    }
});

// logout admin or staff from single device
registry.registerPath({
    method: "post",
    path: "/api/v1/auth/logout",
    tags: ["Auth Routes"],
    summary: "Logout Admin or Staff from Single Device",
    description: "Logout the authenticated admin or staff from the current device.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Logged out successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Logged out successfully" }
                        }
                    }
                }
            }
        }
    }
});

// logout admin or staff from multiple devices
registry.registerPath({
    method: "post",
    path: "/api/v1/auth/logout-all",
    tags: ["Auth Routes"],
    summary: "Logout Admin or Staff from All Devices",
    description: "Logout the authenticated admin or staff from all devices.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Logged out from all devices successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Logged out from all devices successfully" }
                        }
                    }
                }
            }
        }
    }
});

// get me admin or staff
registry.registerPath({
    method: "get",
    path: "/api/v1/auth/me",
    tags: ["Auth Routes"],
    summary: "Get Authenticated Admin or Staff Details",
    description: "Retrieved the details of the authenticated admin or staff.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Admin or Staff retrieved successfully",
            content: {
                "application/json": {
                    schema: adminResponseSchema
                }
            }
        }
    }
});

// get me super admin
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/me",
    tags: ["Super Admin Routes"],
    summary: "Get Authenticated Super Admin Details",
    description: "Retrieve the details of the authenticated super admin.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Super admin retrieved successfully",
            content: {
                "application/json": {
                    schema: superAdminResponseSchema
                }
            }
        }
    }
});

// logout super admin
registry.registerPath({
    method: "post",
    path: "/api/v1/super-admin/auth/logout",
    tags: ["Super Admin Routes"],
    summary: "Logout Super Admin from Single Device",
    description: "Logout the authenticated super admin from the current device.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Super admin logged out successfully",
        }
    }
});

// delete admin by super admin
registry.registerPath({
    method: "delete",
    path: "/api/v1/super-admin/admins/{id}",
    tags: ["Super Admin Routes"],
    summary: "Delete Admin",
    description: "Super admin deletes an admin account.",
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Admin deleted successfully",
        },
    },
});

// get admin by super admin
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/admins/{id}",
    tags: ["Super Admin Routes"],
    summary: "Get Authenticated Admin Details",
    description: "Retrieved the details of the authenticated admin.",
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Admin retrieved successfully",
            content: {
                "application/json": {
                    schema: adminResponseSchema
                }
            }
        }
    }
}
);

// changes admin status by super admin
registry.registerPath({
    method: "patch",
    path: "/api/v1/super-admin/admins/{id}/status",
    tags: ["Super Admin Routes"],
    summary: "Change Admin Status",
    description: "Super admin changes admin active/inactive status.",
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: statusSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Admin status changed successfully",
            content: {
                "application/json": {
                    schema: adminsResponseSchema,
                },
            },
        },
    },
});


// get all admins by super admin
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/admins",
    tags: ["Super Admin Routes"],
    summary: "Get All Admins",
    description: "Super admin fetches all admins.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Admins retrieved successfully",
            content: {
                "application/json": {
                    schema: adminsResponseSchema,
                },
            },
        },
    },
});

// get admin with companies by super admin
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/admins/{id}/companies",
    tags: ["Super Admin Routes"],
    summary: "Get Admin with Companies",
    description: "Super admin fetches an admin along with their associated companies.",
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Admin with companies retrieved successfully",
            content: {
                "application/json": {
                    schema: adminWithCompaniesResponseSchema,
                },
            },
        },
    },
});

// get all companies
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/companies",
    tags: ["Super Admin Routes"],
    summary: "Get All Companies",
    description: "Super admin fetches all companies.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Companies retrieved successfully",
            content: {
                "application/json": {
                    schema: companiesResponseSchema,
                },
            },
        },
    },
});


// change company status by super admin
registry.registerPath({
    method: "patch",
    path: "/api/v1/super-admin/companies/{id}/status",
    tags: ["Super Admin Routes"],
    summary: "Change Company Status",
    description: "Super admin updates company status.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: statusSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Company status updated successfully",
            content: {
                "application/json": {
                    schema: companyResponseSchema,
                },
            },
        },
    },
});

// create company subscription
registry.registerPath({
    method: "post",
    path: "/api/v1/super-admin/companies/{id}/subscriptions",
    tags: ["Super Admin Routes"],
    summary: "Create Company Subscription",
    description: "Super admin create company subscription.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: subscriptionSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Company subscription created successfully",
            content: {
                "application/json": {
                    schema: subscriptionResponseSchema,
                },
            },
        },
    },
});

// /subscriptions/:id/send-reminder
registry.registerPath({
    method: "post",
    path: "/api/v1/super-admin/subscriptions/{id}/send-reminder",
    tags: ["Super Admin Routes"],
    summary: "Send Subscription Reminder Mail",
    description: "Super admin send subscription reminder mail to company.",
    security: [{ bearerAuth: [] }],
    request: {
        params: subscriptionIdSchema,
    },
    responses: {
        200: {
            description: "Subscription reminder mail send successfully",
        },
    },
});

// get companies subscriptions
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/companies/{id}/subscriptions",
    tags: ["Super Admin Routes"],
    summary: "Get Company Subscriptions",
    description: "Super admin fetches company subscriptions.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
    },
    responses: {
        200: {
            description: "Company subscriptions retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionsResponseSchema,
                },
            },
        },
    },
});

// get all subscriptions
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/subscriptions",
    tags: ["Super Admin Routes"],
    summary: "Get All Company Subscriptions",
    description: "Super admin fetches all company subscriptions.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Subscriptions retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionsResponseSchema,
                },
            },
        },
    },
});

// get companies active subscriptions
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/companies/{id}/subscriptions/active",
    tags: ["Super Admin Routes"],
    summary: "Get Company Active Subscriptions",
    description: "Super admin fetches company active subscriptions.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
    },
    responses: {
        200: {
            description: "Company active subscriptions retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionsResponseSchema,
                },
            },
        },
    },
});

// cancel company subscription
registry.registerPath({
    method: "patch",
    path: "/api/v1/super-admin/subscriptions/{id}/cancel",
    tags: ["Super Admin Routes"],
    summary: "Cancel Company Subscription",
    description: "Super admin cancel company subscription.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
    },
    responses: {
        200: {
            description: "Subscription cancelled successfully",
            content: {
                "application/json": {
                    schema: subscriptionResponseSchema,
                },
            },
        },
    },
});

// create company subscription payment
registry.registerPath({
    method: "post",
    path: "/api/v1/super-admin/subscriptions/{id}/payments",
    tags: ["Super Admin Routes"],
    summary: "Create Company Subscription Payment",
    description: "Super admin create company subscription payment.",
    security: [{ bearerAuth: [] }],
    request: {
        params: subscriptionIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: subscriptionPaymentSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Subscription payment created successfully",
            content: {
                "application/json": {
                    schema: subscriptionPaymentResponseSchema,
                },
            },
        },
    },
});

// get company subscription payments
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/subscriptions/{id}/payments",
    tags: ["Super Admin Routes"],
    summary: "Get Company Subscription Payments",
    description: "Super admin get company subscription payments.",
    security: [{ bearerAuth: [] }],
    request: {
        params: subscriptionIdSchema,
    },
    responses: {
        200: {
            description: "Subscription payments retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionPaymentsResponseSchema,
                },
            },
        },
    },
});

// get company subscription payment by id
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/subscriptions/payments/{id}",
    tags: ["Super Admin Routes"],
    summary: "Get Company Subscription Payment By Id",
    description: "Super admin get company subscription payment by payment Id.",
    security: [{ bearerAuth: [] }],
    request: {
        params: subscriptionPaymentIdSchema,
    },
    responses: {
        200: {
            description: "Subscription payment retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionPaymentResponseSchema,
                },
            },
        },
    },
});

// get all subscription payments 
registry.registerPath({
    method: "get",
    path: "/api/v1/super-admin/subscriptions/payments",
    tags: ["Super Admin Routes"],
    summary: "Get All Company Subscription Payments",
    description: "Super admin get all company subscription payments",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "All Subscription payments retrieved successfully",
            content: {
                "application/json": {
                    schema: subscriptionPaymentsResponseSchema,
                },
            },
        },
    },
});

// admin register endpoint
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/auth/register",

    tags: ["Admin Routes"],
    summary: "Admin Registration",
    description: "Register a new admin account.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: createAdminSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: "Admin registered successfully. Please check your email to verify your account.",
            content: {
                "application/json": {
                    schema: adminResponseSchema
                }
            }
        }
    }
});

// verify account by admin with otp
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/auth/verify-email",

    tags: ["Admin Routes"],
    summary: "Verify Admin Account",
    description: "Verify an admin account using OTP sent to email.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: otpVerificationSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Account verified successfully",
            content: {
                "application/json": {
                    schema: adminResponseSchema
                }
            }
        }
    }
});

// resend otp for admin (expiry = 2min)
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/auth/resend-otp",

    tags: ["Admin Routes"],
    summary: "Resend OTP for Admin",
    description: "Resend OTP for admin account verification or password reset. OTP will expire in 2 minutes.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: resendOtpSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "OTP resent successfully. Please check your email.",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "OTP resent successfully. Please check your email." },
                            email: { type: "string", example: "kishorpandey981@gmail.com" },
                            type: { type: "string", example: "VERIFY_EMAIL or PASSWORD_RESET" }
                        }
                    }
                }
            }
        }
    }
});


// forgot password for admin
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/auth/forgot-password",
    tags: ["Admin Routes"],
    summary: "Forgot Password for Admin",
    description: "Initiate the forgot password process for an admin account.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            email: { type: "string", example: "kishorpandey981@gmail.com" }
                        }
                    }
                }
            }
        }
    },
    responses: {
        200: {
            description: "Password reset instructions sent successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "Password reset OTP sent successfully. Please check your email."
                            },
                            email: { type: "string", example: "kishorpandey981@gmail.com" }
                        }
                    }
                }
            }
        }
    }
});

// reset password with otp
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/auth/reset-password",
    tags: ["Admin Routes"],
    summary: "Reset Password with OTP",
    description: "Reset the password for an admin account using a one-time password (OTP).",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: resetPasswordSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Password reset successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Password reset successfully" }
                        }
                    }
                }
            }
        }
    }
});

// changed password (auth)
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/change-password",
    tags: ["Admin Routes"],
    summary: "Change Password for Authenticated Admin",
    description: "Change the password for an authenticated admin account.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: changePasswordSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Password changed successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Password changed successfully" }
                        }
                    }
                }
            }
        }
    }
});

// update admin
registry.registerPath({
    method: "patch",
    path: "/api/v1/admins/{id}",

    tags: ["Admin Routes"],
    summary: "Update Admin",
    description: "Update admin information.",
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: updateAdminSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Admin updated successfully",
            content: {
                "application/json": {
                    schema: adminResponseSchema
                }
            }
        }
    }
})

// create company
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/companies",
    tags: ["Admin Routes"],
    summary: "Create Company",
    description: "Create a new company by admin.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: companySchema
                },
            },
        },
    },
    responses: {
        201: {
            description: "Company created successfully",
            content: {
                "application/json": {
                    schema: companyResponseSchema,
                },
            },
        },
    },
});


// get all companies
registry.registerPath({
    method: "get",
    path: "/api/v1/admins/companies",
    tags: ["Admin Routes"],
    summary: "Get All Companies",
    description: "Fetch all companies created by admin.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Companies fetched successfully",
            content: {
                "application/json": {
                    schema: companiesResponseSchema,
                },
            },
        },
    },
});


// get company by id
registry.registerPath({
    method: "get",
    path: "/api/v1/admins/companies/{id}",
    tags: ["Admin Routes"],
    summary: "Get Company By ID",
    description: "Fetch company by ID.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
    },
    responses: {
        200: {
            description: "Company fetched successfully",
            content: {
                "application/json": {
                    schema: companyResponseSchema,
                },
            },
        },
    },
});

// update company
registry.registerPath({
    method: "patch",
    path: "/api/v1/admins/companies/{id}",
    tags: ["Admin Routes"],
    summary: "Update Company",
    description: "Update company information.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: companySchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Company updated successfully",
            content: {
                "application/json": {
                    schema: companyResponseSchema,
                },
            },
        },
    },
});


// delete company
registry.registerPath({
    method: "delete",
    path: "/api/v1/admins/companies/{id}",
    tags: ["Admin Routes"],
    summary: "Delete Company",
    description: "Delete company by ID.",
    security: [{ bearerAuth: [] }],
    request: {
        params: companyIdSchema,
    },
    responses: {
        200: {
            description: "Company deleted successfully",
        },
    },
});

// create staff by admin
registry.registerPath({
    method: "post",
    path: "/api/v1/admins/staff",
    tags: ["Admin Routes"],
    summary: "Create Staff",
    description: "Admin creates a new staff member.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: staffSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Staff created successfully",
            content: {
                "application/json": {
                    schema: staffResponseSchema,
                },
            },
        },
    },
});


// delete staff by admin
registry.registerPath({
    method: "delete",
    path: "/api/v1/admins/staff/{id}",
    tags: ["Admin Routes"],
    summary: "Delete Staff",
    description: "Admin deletes a staff member by ID.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Staff deleted successfully",
        },
    },
});


// get staff by id
registry.registerPath({
    method: "get",
    path: "/api/v1/admins/staff/{id}",
    tags: ["Admin Routes"],
    summary: "Get Staff By ID",
    description: "Fetch a single staff member by ID.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Staff fetched successfully",
            content: {
                "application/json": {
                    schema: staffResponseSchema,
                },
            },
        },
    },
});

// get all staff
registry.registerPath({
    method: "get",
    path: "/api/v1/admins/staff",
    tags: ["Admin Routes"],
    summary: "Get All Staff",
    description: "Fetch all staff members.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Staff fetched successfully",
            content: {
                "application/json": {
                    schema: staffsResponseSchema,
                },
            },
        },
    },
})

// change staff status
registry.registerPath({
    method: "patch",
    path: "/api/v1/admins/staff/{id}/status",
    tags: ["Admin Routes"],
    summary: "Change Staff Status",
    description: "Change the status of a staff.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: statusSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Staff status changed successfully",
            content: {
                "application/json": {
                    schema: staffResponseSchema,
                },
            },
        },
    },
});

// update staff by admin
registry.registerPath({
    method: "patch",
    path: "/api/v1/admins/staff/{id}",
    tags: ["Admin Routes"],
    summary: "Update Staff",
    description: "Admin updates staff information.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: updateStaffSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Staff updated successfully",
            content: {
                "application/json": {
                    schema: staffResponseSchema,
                },
            },
        },
    },
});

// change password for staff
registry.registerPath({
    method: "patch",
    path: "/api/v1/admins/staff/{id}/change-password",
    tags: ["Admin Routes"],
    summary: "Change Staff Password",
    description: "Admin changes password for a staff member.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: changePasswordSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Password changed successfully",
        },
    },
});

// create student
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/students",
    tags: ["Company Routes"],
    summary: "Create Student",
    description: "Create a new student. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: studentSchema
                },
            },
        },
    },
    responses: {
        201: {
            description: "Student created successfully",
            content: {
                "application/json": {
                    schema: studentResponseSchema,
                },
            },
        },
    },
});

// get all students
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/students",
    tags: ["Company Routes"],
    summary: "Get All Students",
    description: "Fetch all students. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Students fetched successfully",
            content: {
                "application/json": {
                    schema: studentsResponseSchema,
                },
            },
        },
    },
});

// get student by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/students/{id}",
    tags: ["Company Routes"],
    summary: "Get Student By ID",
    description: "Fetch student by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Student fetched successfully",
            content: {
                "application/json": {
                    schema: studentResponseSchema,
                },
            },
        },
    },
});

// update student
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/students/{id}",
    tags: ["Company Routes"],
    summary: "Update Student",
    description: "Update student information. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: studentUpdateSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Student updated successfully",
            content: {
                "application/json": {
                    schema: studentResponseSchema,
                },
            },
        },
    },
});

// change student status
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/students/{id}/status",
    tags: ["Company Routes"],
    summary: "Change Student Status",
    description: "Change the status of a student. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: statusSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Student status changed successfully",
            content: {
                "application/json": {
                    schema: studentResponseSchema,
                },
            },
        },
    },
});

// delete student
registry.registerPath({
    method: "delete",
    path: "/api/v1/companies/students/{id}",
    tags: ["Company Routes"],
    summary: "Delete Student",
    description: "Delete student by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Student deleted successfully",
        },
    },
});

// get all students with payments
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/students/payments",
    tags: ["Company Routes"],
    summary: "Get All Students With Payments",
    description: "Fetch all students with payment history. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Students fetched with payments successfully",
            content: {
                "application/json": {
                    schema: studentsWithPaymentsSchema,
                },
            },
        },
    },
});

// get student with payments
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/students/{id}/payments",
    tags: ["Company Routes"],
    summary: "Get Student With Payments",
    description: "Fetch student with payment history. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Student fetched with fee account successfully",
            content: {
                "application/json": {
                    schema: studentWithPaymentsSchema,
                },
            },
        },
    },
});


// get student with fee account
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/students/{id}/fee-accounts",
    tags: ["Company Routes"],
    summary: "Get Student Fee Account",
    description: "Fetch student fee account details. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Student fee account fetched successfully",
            content: {
                "application/json": {
                    schema: studentWithFeeAccountSchema
                }
            }
        },
    },
});

// create inventory
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/inventory",
    tags: ["Company Inventory Routes"],
    summary: "Create Inventory",
    description: "Create a new inventory item. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: inventorySchema
                },
            },
        },
    },
    responses: {
        201: {
            description: "Inventory created successfully",
            content: {
                "application/json": {
                    schema: inventoryResponseSchema,
                },
            },
        },
    },
});


// get inventory by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/{id}",
    tags: ["Company Inventory Routes"],
    summary: "Get Inventory By ID",
    description: "Fetch inventory by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Inventory fetched successfully",
            content: {
                "application/json": {
                    schema: inventoryResponseSchema,
                },
            },
        },
    },
});

// get inventory alerts
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/alerts",
    tags: ["Company Inventory Routes"],
    summary: "Get Inventory alerts",
    description: "Fetch inventory alerts by admin or staff. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Stock alerts information",
            content: {
                "application/json": {
                    schema: stockAlertsSchema,
                },
            },
        },
    },
});

// get inventory summary
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/summary",
    tags: ["Company Inventory Routes"],
    summary: "Get Inventory summary",
    description: "Fetch inventory summary by admin or staff. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Stock summary information",
            content: {
                "application/json": {
                    schema: stockSummarySchema,
                },
            },
        },
    },
});


// get all inventories
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory",
    tags: ["Company Inventory Routes"],
    summary: "Get All Inventories",
    description: "Fetch all inventory items. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Inventories fetched successfully",
            content: {
                "application/json": {
                    schema: inventoriesResponseSchema,
                },
            },
        },
    },
});


// update inventory
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/inventory/{id}",
    tags: ["Company Inventory Routes"],
    summary: "Update Inventory",
    description: "Update inventory information. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: inventorySchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Inventory updated successfully",
            content: {
                "application/json": {
                    schema: inventoryResponseSchema,
                },
            },
        },
    },
});


// delete inventory
registry.registerPath({
    method: "delete",
    path: "/api/v1/companies/inventory/{id}",
    tags: ["Company Inventory Routes"],
    summary: "Delete Inventory",
    description: "Delete inventory by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Inventory deleted successfully",
        },
    },
});

// stock in inventory
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/inventory/{id}/stock-in",
    tags: ["Company Inventory Routes"],
    summary: "Purchase inventory or items",
    description: "Purchase inventory or items from suppliers. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: purchaseStockSchema
                },
            },
        },
    },
    responses: {
        201: {
            description: "Stock purchased successfully.",
            content: {
                "application/json": {
                    schema: purchaseInventorySchema,
                },
            },
        },
    },
});


// stock out inventory
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/inventory/{id}/stock-out",
    tags: ["Company Inventory Routes"],
    summary: "Issue inventory or items",
    description: "Issue inventory or items from company. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: stockOutSchema
                },
            },
        },
    },
    responses: {
        201: {
            description: "Stock issued successfully.",
            content: {
                "application/json": {
                    schema: issueInventorySchema,
                },
            },
        },
    },
});

// inventory stock history
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/{id}/stock-history",
    tags: ["Company Inventory Routes"],
    summary: "Get inventory with stock history",
    description: "Get inventory with stock history from company. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Stock histories retrieved successfully.",
            content: {
                "application/json": {
                    schema: stockHistoriesResponse,
                },
            },
        },
    },
});

// stock history routes

// get stock history by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/stock-history/{id}",
    tags: ["Company Inventory Routes"],
    summary: "Get stock history by id",
    description: "Get stock history from company. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Stock history retrieved successfully.",
            content: {
                "application/json": {
                    schema: stockHistoryResponse,
                },
            },
        },
    },
});

// get all stock history
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/inventory/stock-history",
    tags: ["Company Inventory Routes"],
    summary: "Get all stock history",
    description: "Get all stock history from company. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Stock histories retrieved successfully.",
            content: {
                "application/json": {
                    schema: stockHistoriesResponse,
                },
            },
        },
    },
});

// create fee account
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/fee-accounts",
    tags: ["Company Routes"],
    summary: "Create Fee Account",
    description: "Create a fee account for a student. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: feeAccountSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Fee account created successfully",
            content: {
                "application/json": {
                    schema: feeAccountResponseSchema,
                },
            },
        },
    },
});


// get fee account by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/fee-accounts/{id}",
    tags: ["Company Routes"],
    summary: "Get Fee Account By ID",
    description: "Fetch fee account by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Fee account fetched successfully",
            content: {
                "application/json": {
                    schema: feeAccountResponseSchema,
                },
            },
        },
    },
});


// get all fee accounts
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/fee-accounts",
    tags: ["Company Routes"],
    summary: "Get All Fee Accounts",
    description: "Fetch all fee accounts. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Fee accounts fetched successfully",
            content: {
                "application/json": {
                    schema: feeAccountsResponseSchema,
                },
            },
        },
    },
});

// create course
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/courses",
    tags: ["Company Routes"],
    summary: "Create Course",
    description: "Create a new course. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: courseSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Course created successfully",
            content: {
                "application/json": {
                    schema: courseResponseSchema,
                },
            },
        },
    },
});


// get course by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/courses/{id}",
    tags: ["Company Routes"],
    summary: "Get Course By ID",
    description: "Fetch course by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Course fetched successfully",
            content: {
                "application/json": {
                    schema: courseResponseSchema,
                },
            },
        },
    },
});


// get all courses
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/courses",
    tags: ["Company Routes"],
    summary: "Get All Courses",
    description: "Fetch all courses. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Courses fetched successfully",
            content: {
                "application/json": {
                    schema: coursesResponseSchema,
                },
            },
        },
    },
});


// get all courses with students
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/courses/students",
    tags: ["Company Routes"],
    summary: "Get All Courses With Students",
    description: "Fetch all courses with enrolled students. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Courses with students fetched successfully",
            content: {
                "application/json": {
                    schema: coursesWithStudentsResponseSchema,
                },
            },
        },
    },
});


// update course
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/courses/{id}",
    tags: ["Company Routes"],
    summary: "Update Course",
    description: "Update course information. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: courseSchema
                },
            },
        },
    },
    responses: {
        200: {
            description: "Course updated successfully",
            content: {
                "application/json": {
                    schema: courseResponseSchema,
                },
            },
        },
    },
});


// delete course
registry.registerPath({
    method: "delete",
    path: "/api/v1/companies/courses/{id}",
    tags: ["Company Routes"],
    summary: "Delete Course",
    description: "Delete course by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Course deleted successfully",
        },
    },
});

// create batch
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/batches",
    tags: ["Company Routes"],
    summary: "Create Batch",
    description: "Create a new batch. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: batchSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Batch created successfully",
            content: {
                "application/json": {
                    schema: batchResponseSchema,
                },
            },
        },
    },
});


// get all batches
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/batches",
    tags: ["Company Routes"],
    summary: "Get All Batches",
    description: "Fetch all batches. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Batches fetched successfully",
            content: {
                "application/json": {
                    schema: batchesResponseSchema,
                },
            },
        },
    },
});


// get all batches with students
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/batches/students",
    tags: ["Company Routes"],
    summary: "Get All Batches With Students",
    description: "Fetch all batches with enrolled students. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Batches with students fetched successfully",
            content: {
                "application/json": {
                    schema: batchesWithStudentsResponseSchema,
                },
            },
        },
    },
});


// get batch by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/batches/{id}",
    tags: ["Company Routes"],
    summary: "Get Batch By ID",
    description: "Fetch batch by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Batch fetched successfully",
            content: {
                "application/json": {
                    schema: batchResponseSchema,
                },
            },
        },
    },
});


// update batch
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/batches/{id}",
    tags: ["Company Routes"],
    summary: "Update Batch",
    description: "Update batch information. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: batchSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Batch updated successfully",
            content: {
                "application/json": {
                    schema: batchResponseSchema,
                },
            },
        },
    },
});


// delete batch
registry.registerPath({
    method: "delete",
    path: "/api/v1/companies/batches/{id}",
    tags: ["Company Routes"],
    summary: "Delete Batch",
    description: "Delete batch by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Batch deleted successfully",
        },
    },
});

// create payment
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/payments",
    tags: ["Company Routes"],
    summary: "Create Payment",
    description: "Create a payment for a student. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: paymentSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Payment created successfully",
            content: {
                "application/json": {
                    schema: paymentResponseSchema,
                },
            },
        },
    },
});


// get payment by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/payments/{id}",
    tags: ["Company Routes"],
    summary: "Get Payment By ID",
    description: "Fetch payment by ID. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
    },
    responses: {
        200: {
            description: "Payment fetched successfully",
            content: {
                "application/json": {
                    schema: paymentResponseSchema,
                },
            },
        },
    },
});


// get all payments
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/payments",
    tags: ["Company Routes"],
    summary: "Get All Payments",
    description: "Fetch all payments. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Payments fetched successfully",
            content: {
                "application/json": {
                    schema: paymentsResponseSchema,
                },
            },
        },
    },
});

// supplier routes

// create supplier
registry.registerPath({
    method: "post",
    path: "/api/v1/companies/suppliers",
    tags: ["Company Routes"],
    summary: "Create supplier",
    description: "Create supplier by admin and staff. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        body: {
            content: {
                "application/json": {
                    schema: supplierSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Supplier created successfully",
            content: {
                "application/json": {
                    schema: supplierResponseSchema,
                },
            },
        },
    },
});

// get all supplier
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/suppliers",
    tags: ["Company Routes"],
    summary: "Get all supplier",
    description: "Get all supplier by admin and staff. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Suppliers retrieved successfully",
            content: {
                "application/json": {
                    schema: suppliersResponseSchema,
                },
            },
        },
    },
});

// get supplier by id
registry.registerPath({
    method: "get",
    path: "/api/v1/companies/suppliers/{id}",
    tags: ["Company Routes"],
    summary: "Get supplier",
    description: "Get supplier by admin and staff. Admin must provide x-company-id header; staff uses company ID from token.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
    },
    responses: {
        200: {
            description: "Supplier retrieved successfully",
            content: {
                "application/json": {
                    schema: supplierResponseSchema,
                },
            },
        },
    },
});

// update supplier by id
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/suppliers/{id}",
    tags: ["Company Routes"],
    summary: "Update supplier",
    description: "Update supplier by admin. Admin must provide x-company-id header.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: supplierSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Supplier updated successfully",
            content: {
                "application/json": {
                    schema: supplierResponseSchema,
                },
            },
        },
    },
});

// delete supplier by id
registry.registerPath({
    method: "delete",
    path: "/api/v1/companies/suppliers/{id}",
    tags: ["Company Routes"],
    summary: "Delete supplier",
    description: "Delete supplier by admin. Admin must provide x-company-id header.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema
    },
    responses: {
        200: {
            description: "Supplier deleted successfully",
        },
    },
});

// change supplier status by id
registry.registerPath({
    method: "patch",
    path: "/api/v1/companies/suppliers/{id}/status",
    tags: ["Company Routes"],
    summary: "Change supplier status",
    description: "Change supplier status by admin. Admin must provide x-company-id header.",
    security: [{ bearerAuth: [] }],
    request: {
        headers: companyIdSchema,
        params: idParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: statusSchema,
                },
            },
        },

    },
    responses: {
        200: {
            description: "Supplier status changed successfully",
            content: {
                "application/json": {
                    schema: supplierResponseSchema,
                },
            },
        },
    },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
    openapi: "3.0.0",
    servers: [{
        url: "http://localhost:5000"
    }],
    info: {
        title: "SMS Backend API",
        version: "1.0.0"
    }
});