import { eq } from "drizzle-orm";
import { badRequest, notFound, ok, unauthorized } from "@/lib/api/http";
import { db } from "@/lib/db";
import { orderStatusHistory, orders } from "@/lib/db/schema";
import { canCustomerReturn, statusNote } from "@/lib/delivery-tracking";
import { sendAdminOrderEmail } from "@/lib/email";
import { sendAdminOrderWhatsApp } from "@/lib/sms";
import { requireCustomerUser } from "@/lib/user-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireCustomerUser();

  if (!user) {
    return unauthorized("Login required");
  }

  const { id } = await context.params;

  const result = await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: {
        id: true,
        userId: true,
        status: true,
        deliveredAt: true,
      },
    });

    if (!order || order.userId !== user.id) {
      return { type: "not-found" as const };
    }

    if (!canCustomerReturn(order.status, order.deliveredAt)) {
      return { type: "bad-request" as const };
    }

    await tx
      .update(orders)
      .set({
        status: "RETURN_REQUESTED",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await tx.insert(orderStatusHistory).values({
      orderId: id,
      status: "RETURN_REQUESTED",
      note: statusNote("RETURN_REQUESTED"),
    });

    return { type: "ok" as const };
  });

  if (result.type === "not-found") {
    return notFound("Order not found");
  }

  if (result.type === "bad-request") {
    return badRequest("This order is not eligible for return");
  }

  await notifyAdminAboutCustomerAction(id, "RETURN_REQUESTED");

  return ok({ message: "Return requested" });
}

async function notifyAdminAboutCustomerAction(orderId: string, status: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      totalAmount: true,
    },
    with: {
      items: true,
    },
  });

  if (!order) {
    return;
  }

  const payload = {
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    totalAmount: Number(order.totalAmount),
    status,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      scentOption: item.scentOption,
    })),
  };
  const results = await Promise.allSettled([
    sendAdminOrderEmail(payload),
    sendAdminOrderWhatsApp(payload),
  ]);
  const failed = results.filter((result) => result.status === "rejected");

  if (failed.length > 0) {
    console.error("Admin return notification failed", {
      orderId,
      failures: failed.map((result) =>
        result.status === "rejected" && result.reason instanceof Error
          ? result.reason.message
          : "Unknown notification error",
      ),
    });
  }
}
