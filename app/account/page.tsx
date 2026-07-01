import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Banknote, Package, ShoppingBag, Truck, UserRound } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { cartItems, orders, products } from "@/lib/db/schema";
import { getCourierStepLabel } from "@/lib/delivery-tracking";
import { formatOrderStatus } from "@/lib/order-status";
import { requireCustomerUser } from "@/lib/user-auth";

export const metadata: Metadata = {
  title: "Account | Scentora",
  description: "Manage your Scentora account, cart, and orders.",
};

export default async function AccountPage() {
  const user = await requireCustomerUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/account");
  }

  const [cartRows, orderRows] = await Promise.all([
    db
      .select({
        productId: products.id,
        name: products.name,
        price: products.price,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, user.id)),
    db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        statusHistory: {
          orderBy: (table, { asc }) => [asc(table.createdAt)],
        },
      },
      columns: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        courierName: true,
        trackingNumber: true,
        trackingUrl: true,
        codAmountDue: true,
        codCollectedAt: true,
        dispatchedAt: true,
        outForDeliveryAt: true,
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 5,
    }),
  ]);

  const totalQuantity = cartRows.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartRows.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-pageBg text-textPrimary">
      <section className="mx-auto w-full max-w-[1100px] px-4 py-10 lg:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-white">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-textSecondary">
                Scentora account
              </p>
              <h1 className="font-heading text-4xl font-semibold">
                {user.name || user.email}
              </h1>
            </div>
          </div>
          <Link
            href="/logout"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-black/15 px-4 text-sm font-semibold hover:bg-black/5"
          >
            Sign out
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-semibold">Saved cart</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#f6f1ea] p-4">
                <p className="text-textSecondary">Items</p>
                <p className="mt-1 text-2xl font-semibold">{totalQuantity}</p>
              </div>
              <div className="rounded-lg bg-[#f6f1ea] p-4">
                <p className="text-textSecondary">Subtotal</p>
                <p className="mt-1 text-2xl font-semibold">${subtotal.toFixed(2)}</p>
              </div>
            </div>
            <Link
              href="/cart"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-black/85"
            >
              View cart
            </Link>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-semibold">Recent orders</h2>
            </div>
            {orderRows.length === 0 ? (
              <div className="rounded-lg bg-[#f6f1ea] p-4 text-sm text-textSecondary">
                No orders yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orderRows.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-black/10 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">#{order.id.slice(0, 8)}</span>
                      <span className="font-semibold">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-textSecondary">
                      {order.createdAt.toLocaleDateString()} | {formatOrderStatus(order.status)}
                    </p>
                    <div className="mt-3 rounded-lg bg-[#f6f1ea] p-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-textSecondary">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="h-4 w-4" aria-hidden="true" />
                          {order.courierName || "Courier pending"}
                        </span>
                        <span>
                          Tracking: {order.trackingNumber || "Not assigned"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Banknote className="h-4 w-4" aria-hidden="true" />
                          COD {order.codCollectedAt ? "collected" : "due"}{" "}
                          ${Number(order.codAmountDue ?? order.totalAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {order.statusHistory.length > 0 ? (
                          order.statusHistory.map((entry) => (
                            <span
                              key={entry.id}
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                entry.status === order.status
                                  ? "bg-black text-white"
                                  : "bg-white text-textSecondary"
                              }`}
                            >
                              {getCourierStepLabel(entry.status)}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-textSecondary">
                            {getCourierStepLabel(order.status)}
                          </span>
                        )}
                      </div>
                      {order.trackingUrl ? (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-xs font-semibold text-textPrimary underline underline-offset-4"
                        >
                          Open courier tracking
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
