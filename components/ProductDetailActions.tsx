"use client";

import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { addGuestCartItem } from "@/lib/guest-cart";
import {
  addGuestWishlistItem,
  isGuestWishlisted,
  removeGuestWishlistItem,
} from "@/lib/guest-wishlist";

type ProductDetailActionsProps = {
  productId: string;
  name: string;
  image: string;
  price: number;
  notes: string;
  tag?: string | null;
  slug?: string;
  isWishlisted?: boolean;
  selectedScent?: string;
};

export default function ProductDetailActions({
  productId,
  name,
  image,
  price,
  notes,
  tag,
  slug,
  isWishlisted = false,
  selectedScent,
}: ProductDetailActionsProps) {
  const [adding, setAdding] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(() =>
    isWishlisted || isGuestWishlisted(productId),
  );
  const [updatingWishlist, setUpdatingWishlist] = useState(false);

  async function addToCart() {
    setAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1, scentOption: selectedScent }),
      });

      if (response.status === 401) {
        addGuestCartItem({
          productId,
          name,
          image,
          price,
          quantity: 1,
          scentOption: selectedScent,
        });
        window.dispatchEvent(new Event("scentora:cart-open"));
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to add item");
      }

      window.dispatchEvent(new Event("scentora:cart-updated"));
      window.dispatchEvent(new Event("scentora:cart-open"));
    } finally {
      setAdding(false);
    }
  }

  async function toggleWishlist() {
    setUpdatingWishlist(true);

    try {
      const response = await fetch("/api/wishlist", {
        method: wishlistActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        if (wishlistActive) {
          removeGuestWishlistItem(productId);
          setWishlistActive(false);
        } else {
          addGuestWishlistItem({
            productId,
            name,
            image,
            price,
            notes,
            tag: tag ?? undefined,
            slug,
          });
          setWishlistActive(true);
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to update wishlist");
      }

      setWishlistActive((active) => !active);
      window.dispatchEvent(new Event("scentora:wishlist-updated"));
    } finally {
      setUpdatingWishlist(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={addToCart}
        disabled={adding}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-textPrimary px-5 text-sm font-semibold text-white transition hover:bg-textPrimary/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        {adding ? "Adding..." : "Add to Bag"}
      </button>

      <button
        type="button"
        onClick={toggleWishlist}
        disabled={updatingWishlist}
        aria-pressed={wishlistActive}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-textPrimary px-5 text-sm font-semibold transition hover:bg-textPrimary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Heart
          className={`h-4 w-4 ${
            wishlistActive ? "fill-red-500 text-red-500" : ""
          }`}
          aria-hidden="true"
        />
        {wishlistActive ? "Saved" : "Wishlist"}
      </button>
    </div>
  );
}
