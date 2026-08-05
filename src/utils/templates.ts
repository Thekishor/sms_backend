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

    <p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;font-family:monospace;">
      ${otp}
    </p>

    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#4B5563;">
      This OTP will expire in <strong>${expiry}</strong>.
    </p>

    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#4B5563;">
      If you did not request this, please ignore this email.
    </p>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B7280;">
      For your security, never share this OTP with anyone.
    </p>

    <hr style="margin:0 0 16px;border:none;border-top:1px solid #E5E7EB;">

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

  <div style="max-width:460px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:24px;">

    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">
      ${title}
    </h1>

    <p style="margin:0 0 16px;color:#4B5563;font-size:16px;line-height:1.6;">
      Hello,
    </p>

    <p style="margin:0 0 20px;color:#4B5563;font-size:16px;line-height:1.6;">
      This is a reminder that the subscription for <strong>${companyName}</strong> will expire in <strong>${daysRemaining} days</strong>.
    </p>

    <p style="margin:0 0 8px;color:#111827;font-size:15px;">
      <strong>Subscription Type:</strong> ${subscriptionType}
    </p>

    <p style="margin:0 0 20px;color:#111827;font-size:15px;">
      <strong>Expiry Date:</strong> ${expiryDate}
    </p>

    <p style="margin:0 0 20px;color:#4B5563;font-size:15px;line-height:1.6;">
      ${message}
    </p>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">

  </div>

</div>
`;
};