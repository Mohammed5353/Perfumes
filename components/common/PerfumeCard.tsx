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

interface PerfumeCardProps {
    image: string;
    name: string;
    notes: string;
    price: string;
    productId?: string;
}

export default function PerfumeCard({ image, name, notes, price, productId }: PerfumeCardProps) {
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
                    name,
                    image,
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
                        name,
                        image,
                        price: parseCurrencyAmount(price),
                        notes,
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
        <div className="bg-[#FFF7DA] rounded-3xl p-4 flex items-center justify-between transition-all group">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 overflow-hidden rounded-2xl">
                    <Image
                        src={image}
                        alt={name}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                    />
                </div>
                <div className="text-left">
                    <h3 className="text-[15px] text-textPrimary font-semibold">
                        {name}
                    </h3>
                    <p className="text-sm text-textSecondary">{notes}</p>
                    <p className="text-accent font-semibold mt-1">{formatKwd(price)}</p>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button
                    onClick={toggleWishlist}
                    disabled={updatingWishlist}
                    className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-60"
                    aria-label="Add to wishlist"
                >
                    <Heart
                        size={18}
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
                    className={`border border-textPrimary rounded-full p-2 flex items-center justify-center 
                     transition-all duration-300 ease-in-out group-hover:bg-textPrimary hover:bg-textPrimary disabled:opacity-60`}
                    aria-label="Add to cart"
                >
                    <ShoppingBag
                        size={18}
                        className="text-textPrimary transition-colors group-hover:text-white hover:text-white"
                    />
                </button>
            </div>
        </div>
    );
}
