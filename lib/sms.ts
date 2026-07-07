import { formatKwd } from "@/lib/currency";

type SendOrderStatusSmsInput = {
  to: string;
  orderId: string;
  status: string;
  note: string;
};

type SendOrderStatusWhatsAppInput = SendOrderStatusSmsInput & {
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

type SendAdminOrderWhatsAppInput = {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  shippingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    fullPhone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  items?: Array<{
    name: string;
    quantity: number;
    scentOption?: string | null;
  }>;
};

const defaultAdminWhatsApp = "+919664146108";

export async function sendOrderStatusSms({
  to,
  orderId,
  status,
  note,
}: SendOrderStatusSmsInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const body = `Scentora order ${shortOrderId(orderId)}: ${note}`;
  const normalizedTo = normalizePhoneNumber(to);

  if (!accountSid || !authToken || !from) {
    console.log(`[dev] Scentora SMS to ${to}: ${body}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: normalizedTo,
        Body: bodyForStatus(status, body),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to send order status SMS");
  }

  return { sent: true, provider: "twilio" as const };
}

export async function sendOrderStatusWhatsApp({
  to,
  orderId,
  status,
  note,
  courierName,
  trackingNumber,
  trackingUrl,
}: SendOrderStatusWhatsAppInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const normalizedTo = normalizePhoneNumber(to);
  const trackingLines = [
    courierName ? `Courier: ${courierName}` : null,
    trackingNumber ? `Tracking number: ${trackingNumber}` : null,
    trackingUrl ? `Track here: ${trackingUrl}` : null,
  ].filter(Boolean);
  const body = [
    `Scentora order ${shortOrderId(orderId)} is now ${formatStatus(status)}.`,
    note,
    ...trackingLines,
  ].join("\n");

  if (!accountSid || !authToken || !from) {
    console.log(`[dev] Customer WhatsApp to ${normalizedTo}: ${body}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: formatWhatsAppAddress(from),
        To: formatWhatsAppAddress(normalizedTo),
        Body: body,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to send order status WhatsApp");
  }

  return { sent: true, provider: "twilio-whatsapp" as const };
}

export async function sendAdminOrderWhatsApp({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  totalAmount,
  status,
  paymentMethod,
  subtotal,
  shippingFee,
  discountAmount,
  shippingAddress,
  items,
}: SendAdminOrderWhatsAppInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.ADMIN_ORDER_WHATSAPP || defaultAdminWhatsApp;
  const addressLines = shippingAddress
    ? [
        shippingAddress.addressLine1,
        shippingAddress.addressLine2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postalCode,
        shippingAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "N/A";

  const itemLines = (items ?? []).length > 0
    ? (items ?? []).map(
        (item) =>
          `- ${item.name}${item.scentOption ? ` (${item.scentOption})` : ""} x${item.quantity}`,
      )
    : ["- No items listed"];

  const body = [
    `Scentora order ${shortOrderId(orderId)} - ${formatStatus(status)}`,
    `Customer: ${customerName || "Guest"}`,
    `Email: ${customerEmail}`,
    `Phone: ${customerPhone || "N/A"}`,
    `Payment: ${paymentMethod || "N/A"}`,
    `Subtotal: ${subtotal !== undefined ? formatKwd(subtotal) : "N/A"}`,
    `Shipping: ${shippingFee !== undefined ? formatKwd(shippingFee) : "N/A"}`,
    `Discount: ${discountAmount !== undefined ? formatKwd(discountAmount) : "N/A"}`,
    `Total: ${formatKwd(totalAmount)}`,
    `Address: ${addressLines}`,
    "Items:",
    ...itemLines,
  ].join("\n");

  if (!accountSid || !authToken || !from) {
    console.log(`[dev] Admin WhatsApp to ${to}: ${body}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: formatWhatsAppAddress(from),
        To: formatWhatsAppAddress(to),
        Body: body,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to send admin WhatsApp notification");
  }

  return { sent: true, provider: "twilio-whatsapp" as const };
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function formatWhatsAppAddress(value: string) {
  if (value.startsWith("whatsapp:")) {
    return value;
  }

  const normalized = normalizePhoneNumber(value);
  return `whatsapp:${normalized}`;
}

function bodyForStatus(status: string, fallback: string) {
  switch (status) {
    case "OUT_FOR_DELIVERY":
      return `${fallback} Your order is out for delivery and should arrive soon.`;
    case "DELIVERED":
      return `${fallback} Your order has been delivered. Thank you for shopping with Scentora.`;
    case "RETURN_REQUESTED":
      return `${fallback} Your return request has been received.`;
    case "RETURNED":
      return `${fallback} Your return request has been accepted. Our team will contact you with the next steps.`;
    case "REFUNDED":
      return `${fallback} Your refund has been processed.`;
    default:
      return fallback;
  }
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
