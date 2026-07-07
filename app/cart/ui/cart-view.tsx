"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
} from "@/lib/guest-cart";
import { formatKwd } from "@/lib/currency";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  scentOption?: string | null;
};

type CartResponse = {
  data: CartItem[];
  meta: {
    totalQuantity: number;
    subtotal: number;
  };
};

export default function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const quantitySyncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const loadCart = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });

      if (response.status === 401) {
        setGuestMode(true);
        setItems(
          getGuestCart().map((item) => ({
            id: `guest-${item.productId}-${item.scentOption ?? "default"}`,
            ...item,
          })),
        );
        return;
      }

      const body = (await response.json()) as CartResponse;
      setGuestMode(false);
      setItems(body.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncQuantity = useCallback(
    (productId: string, quantity: number, scentOption = "") => {
      if (guestMode) {
        updateGuestCartItem(productId, quantity, scentOption);
        return;
      }

      clearTimeout(quantitySyncTimers.current[productId]);

      quantitySyncTimers.current[productId] = setTimeout(async () => {
        try {
          const response = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity, scentOption }),
          });

          if (!response.ok) {
            await loadCart();
            return;
          }

          window.dispatchEvent(new Event("scentora:cart-updated"));
        } catch {
          await loadCart();
        } finally {
          delete quantitySyncTimers.current[productId];
        }
      }, 450);
    },
    [guestMode, loadCart],
  );

  function updateQuantity(productId: string, quantity: number, scentOption = "") {
    if (quantity < 1) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId && (item.scentOption ?? "") === scentOption
          ? { ...item, quantity }
          : item,
      ),
    );
    syncQuantity(productId, quantity, scentOption);
  }

  async function removeItem(productId: string, scentOption = "") {
    if (guestMode) {
      removeGuestCartItem(productId, scentOption);
      await loadCart();
      return;
    }

    clearTimeout(quantitySyncTimers.current[productId]);
    delete quantitySyncTimers.current[productId];

    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, scentOption }),
    });

    if (response.ok) {
      window.dispatchEvent(new Event("scentora:cart-updated"));
      await loadCart();
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadCart);
  }, [loadCart]);

  useEffect(() => {
    const timers = quantitySyncTimers.current;

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return (
    <main className="min-h-screen bg-pageBg text-textPrimary">
      <section className="mx-auto w-full max-w-[1300px] px-4 py-10 lg:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-white">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-textSecondary">
              Your Bag
            </p>
            <h1 className="font-heading text-4xl font-semibold">Cart</h1>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-textSecondary">Loading cart...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-black/10 bg-white p-8 text-center">
            <p className="mb-5 text-textSecondary">Your cart is empty.</p>
            <Link
              href="/shop/all"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white hover:bg-black/85"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 sm:grid-cols-[120px_1fr_auto]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-semibold">{item.name}</h2>
                    <p className="mt-1 text-sm text-textSecondary">
                      {formatKwd(item.price)}
                    </p>
                    {item.scentOption ? (
                      <p className="mt-1 text-sm font-semibold text-textPrimary">
                        Smell: {item.scentOption}
                      </p>
                    ) : null}
                    <div className="mt-4 flex w-fit items-center rounded-lg border border-black/15">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.scentOption ?? "",
                          )
                        }
                        className="grid h-10 w-10 place-items-center hover:bg-black/5"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="grid h-10 min-w-10 place-items-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.scentOption ?? "",
                          )
                        }
                        className="grid h-10 w-10 place-items-center hover:bg-black/5"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.productId, item.scentOption ?? "")}
                    className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 text-textSecondary hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">{formatKwd(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-5 flex min-h-11 w-full items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-black/85"
              >
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
