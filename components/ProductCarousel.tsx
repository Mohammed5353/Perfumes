"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, HTMLAttributes, ReactNode, useRef } from "react";

type ProductCarouselProps = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    showControls: boolean;
    className?: string;
    itemClassName?: string;
};

export default function ProductCarousel({
    children,
    showControls,
    className = "",
    itemClassName = "w-[250px] sm:w-[280px] lg:w-[calc((100%_-_48px)_/_4)]",
    ...trackProps
}: ProductCarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        const track = trackRef.current;
        if (!track) return;

        const amount = Math.min(track.clientWidth, 380);
        track.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    return (
        <div className={`relative ${className}`}>
            {showControls ? (
                <div className="mb-4 flex justify-end gap-2">
                    <button
                        type="button"
                        aria-label="Previous products"
                        onClick={() => scroll("left")}
                        className="grid h-10 w-10 place-items-center rounded-full border border-black/20 bg-white text-textPrimary shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                    >
                        <ChevronLeft size={18} strokeWidth={2.4} />
                    </button>
                    <button
                        type="button"
                        aria-label="Next products"
                        onClick={() => scroll("right")}
                        className="grid h-10 w-10 place-items-center rounded-full border border-black/20 bg-white text-textPrimary shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                    >
                        <ChevronRight size={18} strokeWidth={2.4} />
                    </button>
                </div>
            ) : null}

            <div
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                {...trackProps}
            >
                {Children.map(children, (child) => (
                    <div className={`shrink-0 snap-start ${itemClassName}`}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}
