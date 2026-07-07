import { formatKwd } from "@/lib/currency";

type SendVerificationEmailInput = {
  to: string;
  name: string;
  code: string;
};

type SendPasswordResetEmailInput = {
  to: string;
  name: string;
  code: string;
};

type SendOrderStatusEmailInput = {
  to: string;
  customerName: string | null;
  orderId: string;
  status: string;
  note: string;
};

type SendInvoiceEmailInput = {
  to: string;
  customerName: string | null;
  orderId: string;
  html: string;
};

type SendAdminOrderEmailInput = {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  totalAmount: number;
  status: string;
  items?: Array<{
    name: string;
    quantity: number;
    scentOption?: string | null;
  }>;
};

const defaultAdminEmail = "mohammedpeepa31@gmail.com";

export async function sendVerificationEmail({
  to,
  name,
  code,
}: SendVerificationEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Scentora verification code for ${to}: ${code}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "Scentora <onboarding@resend.dev>",
      to,
      subject: "Verify your Scentora account",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
          <h1>Verify your Scentora account</h1>
          <p>Hello ${escapeHtml(name)},</p>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send verification email");
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendPasswordResetEmail({
  to,
  name,
  code,
}: SendPasswordResetEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Scentora password reset code for ${to}: ${code}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "Scentora <onboarding@resend.dev>",
      to,
      subject: "Reset your Scentora password",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
          <h1>Reset your Scentora password</h1>
          <p>Hello ${escapeHtml(name)},</p>
          <p>Your password reset code is:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
          <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send password reset email");
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendOrderStatusEmail({
  to,
  customerName,
  orderId,
  status,
  note,
}: SendOrderStatusEmailInput) {
  const subject = `Your Scentora order is ${formatStatus(status)}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] ${subject} for ${to}: ${note}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "Scentora <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
          <h1>${escapeHtml(subject)}</h1>
          <p>Hello ${escapeHtml(customerName || "there")},</p>
          <p>${escapeHtml(note)}</p>
          <p><strong>Order:</strong> ${escapeHtml(shortOrderId(orderId))}</p>
          <p>Thank you for shopping with Scentora.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send order status email");
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendInvoiceEmail({
  to,
  customerName,
  orderId,
  html,
}: SendInvoiceEmailInput) {
  const subject = `Invoice for your Scentora order ${shortOrderId(orderId)}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] ${subject} to ${to}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "Scentora <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
          <p>Hello ${escapeHtml(customerName || "there")},</p>
          <p>Here is your invoice:</p>
        </div>
        ${html}
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send invoice email");
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendAdminOrderEmail({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  totalAmount,
  status,
  items = [],
}: SendAdminOrderEmailInput) {
  const to = process.env.ADMIN_ORDER_EMAIL || defaultAdminEmail;
  const subject = `Scentora order ${shortOrderId(orderId)} - ${formatStatus(status)}`;
  const itemRows = items.length
    ? items
        .map(
          (item) =>
            `<li>${escapeHtml(String(item.quantity))} x ${escapeHtml(item.name)}${
              item.scentOption ? ` (${escapeHtml(item.scentOption)})` : ""
            }</li>`,
        )
        .join("")
    : "<li>Items available in admin dashboard.</li>";

  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[dev] Admin email to ${to}: ${subject} for ${customerName || customerEmail}`,
    );
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "Scentora <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
          <h1>${escapeHtml(subject)}</h1>
          <p><strong>Customer:</strong> ${escapeHtml(customerName || "Guest")}</p>
          <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(customerPhone || "N/A")}</p>
          <p><strong>Total:</strong> ${escapeHtml(formatKwd(totalAmount))}</p>
          <p><strong>Status:</strong> ${escapeHtml(formatStatus(status))}</p>
          <p><strong>Order:</strong> ${escapeHtml(shortOrderId(orderId))}</p>
          <h2>Items</h2>
          <ul>${itemRows}</ul>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send admin order email");
  }

  return { sent: true, provider: "resend" as const };
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
