"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import BuyButton from "./BuyButton";
import { addGuestCartItem } from "@/lib/guest-cart";
import {
    addGuestWishlistItem,
    isGuestWishlisted,
    removeGuestWishlistItem,
} from "@/lib/guest-wishlist";
import { parseCurrencyAmount } from "@/lib/currency";

interface ProductCardProps {
    productId?: string;
    image: string;
    name: string;
    notes: string;
    price: string;
    tag?: string;
    category?: string;
    slug?: string;
    isWishlisted?: boolean;
}

export default function ProductCardLarge({
    productId,
    image,
    name,
    notes,
    price,
    tag,
    slug,
    isWishlisted = false,
}: ProductCardProps) {
    const [adding, setAdding] = useState(false);
    const [wishlistActive, setWishlistActive] = useState(() =>
        isWishlisted || (productId ? isGuestWishlisted(productId) : false),
    );
    const [updatingWishlist, setUpdatingWishlist] = useState(false);

    async function addToCart() {
        if (!productId) {
            return;
        }

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
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to add item");
            }

            window.dispatchEvent(new Event("scentora:cart-updated"));
        } finally {
            setAdding(false);
        }
    }

    async function toggleWishlist() {
        if (!productId || updatingWishlist) {
            return;
        }

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
                        tag,
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

    const detailHref = slug || productId ? `/products/${slug || productId}` : null;

    return (
        <div
            className="rounded-soft flex flex-1 flex-col transition-transform duration-300 hover:scale-[101%]"
            itemScope
            itemType="https://schema.org/Product"
        >
            <div className="relative">
                {detailHref ? (
                <Link href={detailHref} aria-label={`View ${name} details`}>
                    <Image
                        src={image}
                        alt={`${name} perfume bottle`}
                        width={360}
                        height={360}
                        className="h-[400px] w-full rounded-2xl object-cover"
                        loading="lazy"
                        priority={false}
                    />
                </Link>
                ) : (
                    <Image
                        src={image}
                        alt={`${name} perfume bottle`}
                        width={360}
                        height={360}
                        className="h-[400px] w-full rounded-2xl object-cover"
                        loading="lazy"
                        priority={false}
                    />
                )}
                {tag ? (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {tag}
                    </span>
                ) : null}
                <button
                    type="button"
                    aria-label={`Add ${name} to cart`}
                    onClick={addToCart}
                    disabled={!productId || adding}
                    className="absolute right-14 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {adding ? (
                        <span className="text-xs font-semibold">...</span>
                    ) : (
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    )}
                </button>
                <button
                    type="button"
                    aria-label={
                        wishlistActive
                            ? `Remove ${name} from wishlist`
                            : `Add ${name} to wishlist`
                    }
                    aria-pressed={wishlistActive}
                    onClick={toggleWishlist}
                    disabled={!productId || updatingWishlist}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Heart
                        className={`h-4 w-4 ${
                            wishlistActive
                                ? "fill-red-500 text-red-500"
                                : "text-textPrimary"
                        }`}
                        aria-hidden="true"
                    />
                </button>
                <div
                    className="absolute bottom-2 left-3 mt-3 w-[90%] rounded-lg border border-white/20 bg-white/10 p-2 shadow-md backdrop-blur-md"
                    itemProp="name"
                >
                    {detailHref ? (
                        <Link href={detailHref} className="hover:underline">
                            <h3 className="text-[15px] font-semibold text-white">{name}</h3>
                        </Link>
                    ) : (
                        <h3 className="text-[15px] font-semibold text-white">{name}</h3>
                    )}
                    <p className="text-sm text-white" itemProp="description">
                        {notes}
                    </p>
                </div>
            </div>

            <BuyButton image={image} name={name} price={price} productId={productId} />
        </div>
    );
}
