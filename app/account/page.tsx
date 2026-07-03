import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Package, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { cartItems, orders, products } from "@/lib/db/schema";
import { requireCustomerUser } from "@/lib/user-auth";
import { OrderTrackingCard } from "./ui/order-tracking-card";

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
                <p className="mt-1 text-2xl font-semibold">
                  KWD {subtotal.toFixed(2)}
                </p>
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
                  <OrderTrackingCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
