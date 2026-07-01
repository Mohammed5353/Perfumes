import CommonLink from "./common/CommonLink";
import ProductCard from "./ProductCardLarge";
import ProductCarousel from "./ProductCarousel";
import SectionHeading from "./SectionHeading";
import { ensureMonthlyBestSellerEvaluation } from "@/lib/api/best-sellers";
import { getProducts } from "@/lib/api/catalog";
import { getWishlistProductIdSet } from "@/lib/api/wishlist";

export default async function BestSellersSection() {
    await ensureMonthlyBestSellerEvaluation();

    const [result, wishlistProductIds] = await Promise.all([
        getProducts({ bestSeller: "true", limit: "6" }),
        getWishlistProductIdSet(),
    ]);
    const products = result.data;

    return (
        <section className="text-center">

            <SectionHeading
                headingElement={<h2 className="text-[28px] font-heading font-semibold text-textPrimary">
                    <span className="text-accent">BEST SELLERS</span> & <span className="text-accent">TRENDING</span> PERFUMES
                </h2>}
                subtitle="Discover the most-loved fragrances, handpicked by our customers."
            />


            <ProductCarousel
                showControls={products.length > 4}
                className="mt-10 text-left"
            >
                {products.map((p) => (
                    <ProductCard
                        key={p.id}
                        productId={p.id}
                        image={p.image}
                        name={p.name}
                        slug={p.slug}
                        notes={p.notes.join(", ")}
                        price={p.price.toFixed(2)}
                        tag={p.tag ?? undefined}
                        category={p.category}
                        isWishlisted={wishlistProductIds.has(p.id)}
                    />
                ))}
            </ProductCarousel>

            <CommonLink href="/best-sellers" inverse className="mt-5" >
                View All
            </CommonLink>
        </section>
    );
}
