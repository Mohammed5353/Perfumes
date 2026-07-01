import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { requireAdminUser } from "@/lib/admin-auth";
import { badRequest, ok, unauthorized } from "@/lib/api/http";
import { db } from "@/lib/db";
import {
  orderStatusValues,
  orders,
  paymentStatusValues,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/db/schema";

export async function GET(request: Request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return unauthorized("Admin login required");
  }

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 100);
  const status = parseOrderStatus(searchParams.get("status"));
  const paymentStatus = parsePaymentStatus(searchParams.get("paymentStatus"));
  const query = searchParams.get("q")?.trim();

  if (searchParams.get("status") && !status) {
    return badRequest("Invalid order status");
  }

  if (searchParams.get("paymentStatus") && !paymentStatus) {
    return badRequest("Invalid payment status");
  }

  const where = buildOrderWhere({ status, paymentStatus, query });
  const [items, totalResult] = await Promise.all([
    db.query.orders.findMany({
      where,
      with: {
        items: true,
        statusHistory: {
          orderBy: (table, { asc }) => [asc(table.createdAt)],
        },
      },
      orderBy: desc(orders.createdAt),
      offset: (page - 1) * limit,
      limit,
    }),
    db.select({ value: count() }).from(orders).where(where),
  ]);
  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return ok({
    data: items.map(serializeOrder),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

function buildOrderWhere({
  paymentStatus,
  query,
  status,
}: {
  paymentStatus: PaymentStatus | null;
  query?: string;
  status: OrderStatus | null;
}) {
  const filters: SQL[] = [];

  if (status) {
    filters.push(eq(orders.status, status));
  }

  if (paymentStatus) {
    filters.push(eq(orders.paymentStatus, paymentStatus));
  }

  if (query) {
    filters.push(
      or(
        sql`cast(${orders.id} as text) ilike ${`%${query}%`}`,
        ilike(orders.customerEmail, `%${query}%`),
        ilike(orders.customerName, `%${query}%`),
      )!,
    );
  }

  return filters.length > 0 ? and(...filters) : undefined;
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function parseOrderStatus(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase() as OrderStatus;
  if (orderStatusValues.includes(normalized)) {
    return normalized;
  }

  return null;
}

function parsePaymentStatus(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase() as PaymentStatus;
  if (paymentStatusValues.includes(normalized)) {
    return normalized;
  }

  return null;
}

type OrderSerializeSource = {
  id: string;
  userId: string | null;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: unknown;
  paymentMethod: string;
  subtotal: string | number;
  shippingFee: string | number;
  totalAmount: string | number;
  status: string;
  paymentStatus: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  codAmountDue: string | number | null;
  codCollectedAt: Date | null;
  dispatchedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<Record<string, unknown>>;
  statusHistory: Array<Record<string, unknown>>;
};

function serializeOrder(order: OrderSerializeSource) {
  return {
    id: order.id,
    userId: order.userId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingAddress:
      typeof order.shippingAddress === "string"
        ? order.shippingAddress
        : JSON.stringify(order.shippingAddress ?? {}),
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    paymentStatus: order.paymentStatus,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    codAmountDue: order.codAmountDue === null ? null : Number(order.codAmountDue),
    codCollectedAt: order.codCollectedAt?.toISOString() ?? null,
    dispatchedAt: order.dispatchedAt?.toISOString() ?? null,
    outForDeliveryAt: order.outForDeliveryAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: String(item.id ?? ""),
      productId: typeof item.productId === "string" ? item.productId : null,
      name: String(item.name ?? ""),
      image: String(item.image ?? ""),
      scentOption: typeof item.scentOption === "string" ? item.scentOption : null,
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 0),
    })),
    statusHistory: order.statusHistory.map((entry) => ({
      id: String(entry.id ?? ""),
      status: String(entry.status ?? ""),
      note: typeof entry.note === "string" ? entry.note : null,
      changedByAdminId:
        typeof entry.changedByAdminId === "string" ? entry.changedByAdminId : null,
      createdAt:
        entry.createdAt instanceof Date
          ? entry.createdAt.toISOString()
          : new Date(String(entry.createdAt ?? "")).toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
