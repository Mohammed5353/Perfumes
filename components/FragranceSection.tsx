import SectionHeading from "./SectionHeading";
import FilterTabs from "./FilterTabs";
import ProductCard from "./ProductCardLarge";
import ProductCarousel from "./ProductCarousel";
import { getProducts } from "@/lib/api/catalog";
import { getWishlistProductIdSet } from "@/lib/api/wishlist";

export default async function FragranceSection() {
    const [result, wishlistProductIds] = await Promise.all([
        getProducts({ limit: "12" }),
        getWishlistProductIdSet(),
    ]);
    const products = result.data;

    // Structured data (JSON-LD)
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Scentora Fragrance Collection",
        itemListElement: products.map((p, index) => ({
            "@type": "Product",
            position: index + 1,
            name: p.name,
            image: `https://yourdomain.com${p.image}`,
            description: `${p.notes.join(", ")} perfume`,
            offers: {
                "@type": "Offer",
                priceCurrency: "KWD",
                price: p.price.toFixed(3),
                availability: "https://schema.org/InStock",
            },
        })),
    };

    return (
        <section
            id="fragrances"
            className=""
            aria-labelledby="fragrance-heading"
        >
            <SectionHeading
                title="INDULGE IN EXQUISITE"
                highlight="FRAGRANCES"
                subtitle="Discover our signature scents crafted with elegance, sophistication, and timeless allure."
            />
            <FilterTabs />

            <ProductCarousel
                showControls={products.length > 4}
                className="mt-2"
                itemScope
                itemType="https://schema.org/ItemList"
            >
                {products.map((p) => (
                    <article key={p.id} itemProp="itemListElement">
                        <ProductCard
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
                    </article>
                ))}
            </ProductCarousel>

            {/* ✅ JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
        </section>
    );
}
