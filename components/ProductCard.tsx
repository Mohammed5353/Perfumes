"use client";

import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { addGuestCartItem } from "@/lib/guest-cart";
import {
    addGuestWishlistItem,
    isGuestWishlisted,
    removeGuestWishlistItem,
} from "@/lib/guest-wishlist";
import { formatKwd, parseCurrencyAmount } from "@/lib/currency";

type Props = {
  img: string;
  title: string;
  price: string;
  productId?: string;
};

export default function ProductCard({ img, title, price, productId }: Props) {
  const [adding, setAdding] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(() =>
    productId ? isGuestWishlisted(productId) : false,
  );
  const [updatingWishlist, setUpdatingWishlist] = useState(false);

  async function addToCart() {
    if (!productId) return;
    setAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (response.status === 401) {
        addGuestCartItem({
          productId,
          name: title,
          image: img,
          price: parseCurrencyAmount(price),
          quantity: 1,
        });
        window.dispatchEvent(new Event("scentora:cart-updated"));
        return;
      }

      if (!response.ok) throw new Error("Unable to add item");
      window.dispatchEvent(new Event("scentora:cart-updated"));
    } finally {
      setAdding(false);
    }
  }

  async function toggleWishlist() {
    if (!productId || updatingWishlist) return;
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
            name: title,
            image: img,
            price: parseCurrencyAmount(price),
          });
          setWishlistActive(true);
        }
        window.dispatchEvent(new Event("scentora:wishlist-updated"));
        return;
      }

      if (!response.ok) throw new Error("Unable to update wishlist");
      setWishlistActive((active) => !active);
      window.dispatchEvent(new Event("scentora:wishlist-updated"));
    } finally {
      setUpdatingWishlist(false);
    }
  }

  return (
    <article className="flex items-start gap-4 p-4 rounded-2xl bg-cardBg shadow-card border border-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all group">
      <div className="w-[72px] rounded-md bg-white flex items-center justify-center shadow-card overflow-hidden">
        <Image
          src={img}
          alt={title}
          width={72}
          height={72}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="font-body text-[1rem] text-textPrimary font-semibold leading-tight">
          {title}
        </h3>
        <p className="text-accent font-body text-[1rem] font-medium mt-2">
          {formatKwd(price)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleWishlist}
          disabled={updatingWishlist}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
          aria-label="Add to wishlist"
        >
          <Heart
            size={16}
            className={`transition-colors ${
              wishlistActive
                ? "fill-red-500 text-red-500"
                : "text-textPrimary"
            }`}
          />
        </button>
        <button
          onClick={addToCart}
          disabled={adding}
          className="p-2 rounded-full hover:bg-textPrimary hover:text-white transition-colors disabled:opacity-60"
          aria-label="Add to cart"
        >
          <ShoppingBag
            size={16}
            className="text-textPrimary group-hover:text-white"
          />
        </button>
      </div>
    </article>
  );
}
