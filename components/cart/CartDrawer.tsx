"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
  type GuestCartItem,
} from "@/lib/guest-cart";

type CartItem = GuestCartItem;

type CartResponse = {
  data?: CartItem[];
};

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    function openDrawer() {
      setOpen(true);
      void loadCart();
    }

    function refreshDrawer() {
      void loadCart();
    }

    window.addEventListener("scentora:cart-open", openDrawer);
    window.addEventListener("scentora:cart-updated", refreshDrawer);
    void loadCart();

    return () => {
      window.removeEventListener("scentora:cart-open", openDrawer);
      window.removeEventListener("scentora:cart-updated", refreshDrawer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function loadCart() {
    setLoading(true);

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });

      if (response.status === 401) {
        setGuestMode(true);
        setItems(getGuestCart());
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load cart");
      }

      setGuestMode(false);
      const body = (await response.json()) as CartResponse;
      setItems(body.data ?? []);
    } catch {
      setItems(getGuestCart());
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) {
      return removeItem(item);
    }

    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.productId,
        quantity,
        scentOption: item.scentOption ?? "",
      }),
    });

    if (response.status === 401) {
      setGuestMode(true);
      updateGuestCartItem(item.productId, quantity, item.scentOption ?? "");
      setItems(getGuestCart());
      return;
    }

    if (response.ok) {
      await loadCart();
      window.dispatchEvent(new Event("scentora:cart-updated"));
    }
  }

  async function removeItem(item: CartItem) {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.productId,
        scentOption: item.scentOption ?? "",
      }),
    });

    if (response.status === 401) {
      setGuestMode(true);
      removeGuestCartItem(item.productId, item.scentOption ?? "");
      setItems(getGuestCart());
      return;
    }

    if (response.ok) {
      await loadCart();
      window.dispatchEvent(new Event("scentora:cart-updated"));
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed left-0 top-0 z-50 flex h-dvh w-full max-w-[390px] flex-col bg-white shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-2xl font-semibold">Your bag</h2>
                  <p className="text-xs font-semibold text-textSecondary">
                    {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 hover:bg-black/5"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && items.length === 0 ? (
                <div className="grid min-h-40 place-items-center text-sm text-textSecondary">
                  Loading cart...
                </div>
              ) : null}

              {!loading && items.length === 0 ? (
                <div className="grid min-h-64 place-items-center text-center">
                  <div>
                    <ShoppingBag
                      className="mx-auto mb-3 h-9 w-9 text-black/30"
                      aria-hidden="true"
                    />
                    <p className="font-semibold">Your bag is empty</p>
                    <p className="mt-1 text-sm text-textSecondary">
                      Add a perfume to start your order.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.scentOption ?? ""}`}
                    className="grid grid-cols-[76px_1fr] gap-3 border-b border-black/10 pb-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      className="h-24 w-[76px] rounded-lg border border-black/10 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.name}</p>
                          {item.scentOption ? (
                            <p className="mt-0.5 text-xs font-semibold text-textSecondary">
                              {item.scentOption}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => void removeItem(item)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/10 hover:bg-black/5"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-black/10">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => void updateQuantity(item, item.quantity - 1)}
                            className="grid h-9 w-9 place-items-center hover:bg-black/5"
                          >
                            -
                          </button>
                          <span className="grid h-9 w-9 place-items-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => void updateQuantity(item, item.quantity + 1)}
                            className="grid h-9 w-9 place-items-center hover:bg-black/5"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold">
                          KWD {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-black/10 p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-textSecondary">Subtotal</span>
                <span className="font-semibold">KWD {subtotal.toFixed(2)}</span>
              </div>
              <div className="grid gap-2">
                <Link
                  href={guestMode ? "/sign-in?redirect_url=/checkout" : "/checkout"}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-black/85"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-black/15 px-4 text-sm font-semibold hover:bg-black/5"
                >
                  View full cart
                </Link>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
