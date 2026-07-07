type InvoiceLineItem = {
  name: string;
  quantity: number;
  price: number;
  scentOption?: string | null;
};

type InvoiceInput = {
  orderId: string;
  createdAt: string | Date;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  currency?: string;
  shippingAddress: unknown;
  items: InvoiceLineItem[];
};

export function buildInvoiceHtml(input: InvoiceInput) {
  const createdAt = input.createdAt instanceof Date ? input.createdAt : new Date(input.createdAt);
  const address = normalizeShippingAddress(input.shippingAddress);
  const currency = input.currency || "KWD";
  const shortId = shortOrderId(input.orderId);
  const orderDate = createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-KW", {
      style: "currency",
      currency,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);

  const rows = input.items
    .map((item) => {
      const label = item.scentOption ? `${item.name} (${item.scentOption})` : item.name;
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #1a1a1a;">${escapeHtml(label)}</div>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">${escapeHtml(formatMoney(item.price))}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${escapeHtml(formatMoney(lineTotal))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.45;">
      <div style="max-width: 740px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
          <div>
            <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px;">SCENTORA</div>
            <div style="margin-top: 6px; font-size: 12px; color: #666;">Invoice</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #666;">Invoice for Order</div>
            <div style="font-family: monospace; font-weight: 700;">${escapeHtml(shortId)}</div>
            <div style="margin-top: 6px; font-size: 12px; color: #666;">Date</div>
            <div style="font-weight: 600;">${escapeHtml(orderDate)}</div>
          </div>
        </div>

        <div style="margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="border: 1px solid #eee; border-radius: 10px; padding: 14px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 700;">
              Bill To
            </div>
            <div style="margin-top: 10px; font-weight: 700;">${escapeHtml(input.customerName || "Customer")}</div>
            <div style="font-size: 12px; color: #444; margin-top: 4px;">${escapeHtml(input.customerEmail)}</div>
            ${
              input.customerPhone
                ? `<div style="font-size: 12px; color: #444; margin-top: 2px;">${escapeHtml(input.customerPhone)}</div>`
                : ""
            }
          </div>
          <div style="border: 1px solid #eee; border-radius: 10px; padding: 14px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 700;">
              Ship To
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #444;">
              ${escapeHtml(address)}
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
              Payment: <span style="color:#1a1a1a; font-weight:600;">${escapeHtml(input.paymentMethod)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 18px; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fafafa; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                <th style="text-align: left; padding: 10px 12px;">Item</th>
                <th style="text-align: right; padding: 10px 12px;">Qty</th>
                <th style="text-align: right; padding: 10px 12px;">Price</th>
                <th style="text-align: right; padding: 10px 12px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
          <div style="width: 320px; border: 1px solid #eee; border-radius: 10px; padding: 14px;">
            <div style="display:flex; justify-content: space-between; font-size: 13px; color:#444;">
              <span>Subtotal</span>
              <span style="font-weight: 600;">${escapeHtml(formatMoney(input.subtotal))}</span>
            </div>
            <div style="display:flex; justify-content: space-between; font-size: 13px; color:#444; margin-top: 8px;">
              <span>Shipping</span>
              <span style="font-weight: 600;">${escapeHtml(formatMoney(input.shippingFee))}</span>
            </div>
            <div style="height: 1px; background:#eee; margin: 12px 0;"></div>
            <div style="display:flex; justify-content: space-between; font-size: 14px;">
              <span style="font-weight: 800;">Total</span>
              <span style="font-weight: 900;">${escapeHtml(formatMoney(input.totalAmount))}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 18px; font-size: 12px; color: #666;">
          Thanks for shopping with Scentora.
        </div>
      </div>
    </div>
  `;
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

function normalizeShippingAddress(value: unknown) {
  if (!value) return "N/A";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "N/A";
  const record = value as Record<string, unknown>;
  const parts = [
    record.firstName && record.lastName
      ? `${String(record.firstName)} ${String(record.lastName)}`
      : null,
    record.addressLine1 ? String(record.addressLine1) : null,
    record.addressLine2 ? String(record.addressLine2) : null,
    record.city ? String(record.city) : null,
    record.state ? String(record.state) : null,
    record.postalCode ? String(record.postalCode) : null,
    record.country ? String(record.country) : null,
  ].filter(Boolean);

  return parts.join(", ");
}
