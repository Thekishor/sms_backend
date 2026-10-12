export const EMAIL_TEMPLATES = {
  EMAIL_VERIFICATION: {
    subject: "Verify Your Email",
    title: "Email Verification",
    message: "Use the OTP below to verify your email address.",
    expiry: "2 minutes",
  },
  PASSWORD_RESET: {
    subject: "Reset Your Password",
    title: "Password Reset",
    message: "Use the OTP below to reset your password.",
    expiry: "2 minutes",
  },
  SUBSCRIPTION_REMINDER: {
    subject: "Subscription Expiry Reminder",
    title: "Subscription Expiring Soon",
    message: "Please renew your subscription before the expiry date to continue enjoying uninterrupted access to our services.",
  },
};

export const OTP_TEMPLATE = (
  title: string,
  message: string,
  otp: string,
  expiry: string
) => {
  return `
<div style="margin:0;padding:20px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <div style="max-width:420px;width:100%;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:24px;box-sizing:border-box;">

    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">
      ${title}
    </h1>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4B5563;">
      ${message}
    </p>

    <div style="margin:0 0 24px;padding:16px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;text-align:center;">
      <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:6px;color:#111827;font-family:monospace;">
        ${otp}
      </p>
    </div>

    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#4B5563;">
      This OTP will expire in <strong>${expiry}</strong>.
    </p>

    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#4B5563;">
      If you did not request this, please ignore this email.
    </p>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B7280;">
      For your security, never share this OTP with anyone.
    </p>

  </div>

</div>
`;
};

export const SUBSCRIPTION_REMINDER_TEMPLATE = (
  title: string,
  companyName: string,
  subscriptionType: string,
  message: string,
  expiryDate: string,
  daysRemaining: number
) => {
  return `
<div style="margin:0;padding:20px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <div style="max-width:460px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:26px;box-shadow:0 4px 14px rgba(15,23,42,0.05);border-top:3px solid #6366F1;">

    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#111827;">
      ${title}
    </h1>

    <p style="margin:0 0 16px;color:#4B5563;font-size:16px;line-height:1.6;">
      Hello,
    </p>

    <p style="margin:0 0 20px;color:#4B5563;font-size:15px;line-height:1.7;">
      This is a reminder that the subscription for <strong style="color:#111827;">${companyName}</strong> will expire in <strong style="color:#D97706;">${daysRemaining} days</strong>.
    </p>

    <div style="margin:0 0 20px;padding:15px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:9px;">

      <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
        <strong style="color:#111827;">Subscription Type:</strong> ${subscriptionType}
      </p>

      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        <strong style="color:#111827;">Expiry Date:</strong> ${expiryDate}
      </p>

    </div>

    <p style="margin:0;color:#4B5563;font-size:15px;line-height:1.7;">
      ${message}
    </p>

  </div>

</div>
`;
};

export const COMPANY_STATUS_UPDATE = (
  adminName: string,
  companyName: string,
  oldStatus: string,
  newStatus: string,
  reason: string
) => {
  return `
  <div style="margin:0;padding:24px;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;color:#334155;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">

    <div style="padding:22px 24px;border-bottom:1px solid #E2E8F0;">
      <h2 style="margin:0;font-size:20px;color:#0F172A;">
        Company Status Update
      </h2>
      <p style="margin:8px 0 0;font-size:14px;color:#64748B;">
        An update regarding your company account.
      </p>
    </div>

    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
        Hello ${adminName},
      </p>

      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;">
        The status of your company account has been updated.
        Please review the details below.
      </p>

      <div style="padding:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
        <p style="margin:0 0 12px;font-size:13px;color:#64748B;">
          Company Name
        </p>
        <p style="margin:0 0 18px;font-size:15px;font-weight:bold;color:#0F172A;">
          ${companyName}
        </p>

        <p style="margin:0 0 8px;font-size:13px;color:#64748B;">
          Previous Status
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;">
          ${oldStatus}
        </p>

        <p style="margin:0 0 8px;font-size:13px;color:#64748B;">
          New Status
        </p>
        <p style="margin:0;font-size:15px;font-weight:bold;color:#2563EB;">
          ${newStatus}
        </p>
      </div>

      ${reason}

      <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#475569;">
        If you have any questions about this update, please contact the
        support team.
      </p>

      <p style="margin:22px 0 0;font-size:14px;line-height:1.7;">
        Regards,<br />
        <strong>Support Team</strong>
      </p>
    </div>

  </div>
</div>
  `
}