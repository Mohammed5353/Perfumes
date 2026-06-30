type SendOrderStatusSmsInput = {
  to: string;
  orderId: string;
  status: string;
  note: string;
};

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

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
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
      return `${fallback} Your return has been completed.`;
    case "REFUNDED":
      return `${fallback} Your refund has been processed.`;
    default:
      return fallback;
  }
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}
