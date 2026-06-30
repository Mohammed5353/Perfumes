"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, LogIn, LogOut, Menu, ShoppingBag, UserPlus, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Show, useUser } from "@clerk/nextjs";
import { getGuestCartQuantity } from "@/lib/guest-cart";
import { getGuestWishlistQuantity } from "@/lib/guest-wishlist";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [wishlistQuantity, setWishlistQuantity] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    let active = true;

    async function loadCart() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });

        if (response.status === 401) {
          if (active) {
            setCartQuantity(getGuestCartQuantity());
          }
          return;
        }

        const body = (await response.json()) as {
          meta?: { totalQuantity?: number };
        };

        if (active) {
          setCartQuantity(body.meta?.totalQuantity ?? 0);
        }
      } catch {
        if (active) {
          setCartQuantity(getGuestCartQuantity());
        }
      }
    }

    async function loadWishlist() {
      try {
        const response = await fetch("/api/wishlist", { cache: "no-store" });

        if (response.status === 401) {
          if (active) {
            setWishlistQuantity(getGuestWishlistQuantity());
          }
          return;
        }

        const body = (await response.json()) as {
          meta?: { total?: number };
        };

        if (active) {
          setWishlistQuantity(body.meta?.total ?? 0);
        }
      } catch {
        if (active) {
          setWishlistQuantity(getGuestWishlistQuantity());
        }
      }
    }

    function loadSessionState() {
      void loadCart();
      void loadWishlist();
    }

    loadSessionState();

    window.addEventListener("scentora:cart-updated", loadCart);
    window.addEventListener("scentora:wishlist-updated", loadWishlist);
    window.addEventListener("scentora:auth-updated", loadSessionState);

    return () => {
      active = false;
      window.removeEventListener("scentora:cart-updated", loadCart);
      window.removeEventListener("scentora:wishlist-updated", loadWishlist);
      window.removeEventListener("scentora:auth-updated", loadSessionState);
    };
  }, []);

  const accountLabel = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Account";
  const accountImage = user?.imageUrl;

  return (
    <header className="w-full">
      <div className="relative mx-auto flex max-w-[1300px] items-center justify-between p-4 font-body text-[#1A1A1A]">
        <div className="flex flex-1 items-center gap-6">
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-md md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <nav className="hidden items-center gap-6 text-[15px] font-bold md:flex">
            <Link href="/" className="hover:opacity-70" prefetch>
              Home
            </Link>
            <Link href="/shop/all" className="hover:opacity-70" prefetch>
              Shop
            </Link>
            <Link href="/best-sellers" className="hover:opacity-70" prefetch>
              Best Sellers
            </Link>
            <Link href="/collections/all" className="hover:opacity-70" prefetch>
              Collection
            </Link>
            <Link href="/guide" className="hover:opacity-70" prefetch>
              Guide
            </Link>
            <Link href="/about" className="hover:opacity-70" prefetch>
              About
            </Link>
          </nav>
        </div>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center font-heading text-2xl font-bold uppercase tracking-widest"
        >
          SCENTORA
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
          <Link href="/cart" aria-label="Cart" className="relative">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-black/50 hover:bg-black/5">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            </span>
            {cartQuantity > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-[#F9A826] px-1.5 text-[10px] font-semibold leading-none text-black">
                {cartQuantity}
              </span>
            ) : null}
          </Link>

          <Link href="/wishlist" aria-label="Wishlist" className="relative">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-black/50 hover:bg-black/5">
              <Heart
                className={`h-4 w-4 ${
                  wishlistQuantity > 0 ? "fill-red-500 text-red-500" : ""
                }`}
                aria-hidden="true"
              />
            </span>
            {wishlistQuantity > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-[#F9A826] px-1.5 text-[10px] font-semibold leading-none text-black">
                {wishlistQuantity}
              </span>
            ) : null}
          </Link>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              aria-label="Sign in"
              className="grid h-9 w-9 place-items-center rounded-full border border-black/50 hover:bg-black/5"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Show>
          <Show when="signed-in">
            <div className="relative">
              <button
                type="button"
                aria-label="Open account menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-black/50 hover:bg-black/5"
              >
                {accountImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountImage}
                    alt={accountLabel}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <AnimatePresence>
                {accountMenuOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-30 w-[240px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg"
                  >
                    <div className="border-b border-black/10 px-4 py-3">
                      <p className="truncate text-sm font-semibold">{accountLabel}</p>
                      <p className="truncate text-xs text-textSecondary">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Manage Orders
                    </Link>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </Show>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="hidden min-h-9 items-center justify-center gap-2 rounded-full border border-black/50 px-4 text-sm font-semibold text-[#1A1A1A] transition hover:bg-black/5 sm:inline-flex"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="hidden min-h-9 items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-4 text-sm font-semibold text-white transition hover:bg-black/85 sm:inline-flex"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Sign up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/logout"
              className="hidden min-h-9 items-center justify-center gap-2 rounded-full border border-black/50 px-4 text-sm font-semibold text-[#1A1A1A] transition hover:bg-black/5 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Link>
          </Show>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/10 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 pb-3 text-[15px] font-bold text-[#1A1A1A]">
              {[
                ["Home", "/"],
                ["Shop", "/shop/all"],
                ["Best Sellers", "/best-sellers"],
                ["Collection", "/collections/all"],
                ["Guide", "/guide"],
                ["About", "/about"],
                ["Cart", "/cart"],
                ["Wishlist", "/wishlist"],
                ...(user ? [["Orders", "/account"]] : []),
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 hover:bg-black/5"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Sign up
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Manage Orders
                </Link>
                <Link
                  href="/logout"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </Link>
              </Show>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
