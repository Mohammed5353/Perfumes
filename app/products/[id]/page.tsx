import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, PackageCheck, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import Newsletter from "@/components/common/Newsletter";
import ProductCardLarge from "@/components/ProductCardLarge";
import ProductDetailVariantClient from "@/components/ProductDetailVariantClient";
import ProductReviews from "@/components/ProductReviews";
import { findProductByIdOrSlug, getProductVariants, getRelatedProducts } from "@/lib/api/catalog";
import { getProductReviewFeed } from "@/lib/api/reviews";
import { getWishlistProductIdSet } from "@/lib/api/wishlist";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await findProductByIdOrSlug(id);

  if (!product) {
    return {
      title: "Product Not Found | Scentora",
    };
  }

  const title = product.seoTitle ?? `${product.name} Perfume | Scentora`;
  const description =
    product.seoDescription ?? product.detailedDescription ?? product.description;
  const canonical = product.seoUrl ?? `/products/${product.slug}`;
  const keywords =
    product.seoKeywords.length > 0
      ? product.seoKeywords
      : [
          product.name,
          product.modelNo,
          "Scentora",
          "perfume",
          "fragrance",
          product.categoryDetails.name,
          ...product.notes,
        ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Scentora",
      type: "website",
      images: [
        {
          url: product.image,
          width: 1200,
          height: 1200,
          alt: `${product.name} perfume bottle`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, wishlistProductIds] = await Promise.all([
    findProductByIdOrSlug(id),
    getWishlistProductIdSet(),
  ]);

  if (!product) {
    notFound();
  }

  const productPath = product.seoUrl ?? `/products/${product.slug}`;
  const productUrl = productPath.startsWith("http")
    ? productPath
    : `${siteUrl}${productPath}`;
  const shoppingDescription =
    product.googleShoppingDescription ??
    product.seoDescription ??
    product.detailedDescription ??
    product.description;
  const productDetailHtml =
    product.productDetailHtml ?? buildDefaultProductDetailHtml(product);
  const variants = await getProductVariants(product.id);
  const relatedProducts = await getRelatedProducts({
    productId: product.id,
    categoryId: product.categoryDetails.id,
    notes: product.notes,
    tag: product.tag ?? null,
    collectionIds: product.collectionDetails.map((collection: { id: string }) => collection.id),
    limit: 3,
  });
  const reviewFeed = await getProductReviewFeed(product.id, 6);
  const collectionLabel =
    product.collectionDetails
      .map((collection: { name: string }) => collection.name)
      .join(", ") ||
    "Scentora";
  const heroNotes =
    product.notes.length > 0 ? product.notes.slice(0, 4) : ["Amber", "Vanilla", "Sandalwood"];
  const availability =
    product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.image],
    description: shoppingDescription,
    sku: product.modelNo,
    brand: {
      "@type": "Brand",
      name: "Scentora",
    },
    category: product.categoryDetails.name,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Notes",
        value: product.notes.join(", "),
      },
      {
        "@type": "PropertyValue",
        name: "Google Shopping Description",
        value: shoppingDescription,
      },
      {
        "@type": "PropertyValue",
        name: "Collection",
        value:
          product.collectionDetails
            .map((collection: { name: string }) => collection.name)
            .join(", ") ||
          "Scentora",
      },
    ],
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KWD",
      price: product.price.toFixed(3),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(reviewFeed.summary.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewFeed.summary.averageRating.toFixed(1),
            reviewCount: reviewFeed.summary.totalReviews,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${siteUrl}/shop/all`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen overflow-hidden bg-pageBg text-textPrimary">
      <section className="mx-auto w-full max-w-[1360px] px-4 py-6 font-body lg:px-6 lg:py-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop/all" },
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />

        <ProductDetailVariantClient
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            image: product.image,
            modelNo: product.modelNo,
            description: product.description,
            price: product.price,
            stock: product.stock,
            notes: product.notes,
            scentOptions: product.scentOptions,
            tag: product.tag,
            categoryDetails: { name: product.categoryDetails.name },
          }}
          collectionLabel={collectionLabel}
          heroNotes={heroNotes}
          variants={variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            modelNo: variant.modelNo,
            image: variant.image,
            price: variant.price,
            stock: variant.stock,
          }))}
          isWishlisted={wishlistProductIds.has(product.id)}
        />

        <section className="mt-12 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-2xl bg-[#20150f] p-6 text-white md:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12">
              <Sparkles className="h-5 w-5 text-accentLight" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-heading text-3xl font-semibold">
              Built around a memorable scent trail
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              {product.name} is presented with a clear fragrance profile, selectable smell
              options, and product identifiers so customers can compare, remember, and reorder
              with confidence.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {heroNotes.map((note: string, index: number) => (
              <ScentNoteCard
                key={note}
                note={note}
                index={index}
                productName={product.name}
              />
            ))}
          </div>
        </section>

        <section
          id="detailed-description"
          className="mt-12 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
        >
          <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="bg-[#f7edd8] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">
                Detail guide
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">
                {product.name} fragrance story
              </h2>
              <div className="mt-6 grid gap-3">
                <GuideRow icon={<Clock3 className="h-4 w-4" />} label="Best for" value="Daily wear, gifting, evening plans" />
                <GuideRow icon={<PackageCheck className="h-4 w-4" />} label="Stock status" value={product.stock > 0 ? "Ready to ship" : "Temporarily unavailable"} />
                <GuideRow icon={<BadgeCheck className="h-4 w-4" />} label="Reference" value={product.modelNo} />
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div
                className="space-y-4 text-sm leading-7 text-textSecondary md:text-base [&_b]:text-textPrimary [&_li]:pl-1 [&_p]:max-w-4xl [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5 md:[&_ul]:grid-cols-2"
                dangerouslySetInnerHTML={{ __html: productDetailHtml }}
              />
            </div>
          </div>
        </section>

        <ProductReviews
          productId={product.id}
          productPath={productPath}
          initialReviews={reviewFeed.reviews}
          initialSummary={reviewFeed.summary}
        />

        <section className="pt-12">
          <Newsletter />
        </section>

        {relatedProducts.length > 0 ? (
          <section className="pt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">
                  Similar picks
                </p>
                <h2 className="mt-2 font-heading text-3xl font-semibold text-textPrimary">
                  You may also like
                </h2>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCardLarge
                  key={item.id}
                  productId={item.id}
                  image={item.image}
                  name={item.name}
                  notes={(item.notes ?? []).slice(0, 3).join(", ")}
                  price={item.price.toFixed(2)}
                  tag={item.tag ?? undefined}
                  slug={item.slug}
                  isWishlisted={wishlistProductIds.has(item.id)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  );
}

function buildDefaultProductDetailHtml(product: NonNullable<Awaited<ReturnType<typeof findProductByIdOrSlug>>>) {
  const notes = product.notes.length > 0 ? product.notes : ["Amber", "Vanilla", "Sandalwood"];
  const [first, second, third] = notes;

  return `
    <p>${product.name} is designed as a polished signature perfume with a refined opening, smooth heart, and comfortable long-lasting base. The fragrance balances ${first ?? "warmth"} with ${second ?? "softness"} so it feels premium without becoming overwhelming. It is suitable for daily wear, evening plans, gifting, and customers who want a scent that feels confident, clean, and memorable.</p>
    <p><b>Features</b></p>
    <ul>
      <li>Professional fragrance profile with ${notes.join(", ")}.</li>
      <li>Balanced scent trail for personal wear and special occasions.</li>
      <li>Premium presentation suitable for gifting.</li>
      <li>Comfortable blend that works across seasons.</li>
      <li>Authentic Scentora catalog product with store-managed details.</li>
      <li>Recommended smell option: ${third ?? first ?? "Signature blend"}.</li>
    </ul>
  `;
}


function ScentNoteCard({
  note,
  index,
  productName,
}: {
  note: string;
  index: number;
  productName: string;
}) {
  const labels = ["Opening", "Heart", "Base", "Trail"];
  const tones = [
    "bg-[#fff3d8]",
    "bg-[#f2eadf]",
    "bg-[#eaf1e7]",
    "bg-[#f5e5db]",
  ];

  return (
    <article className={`rounded-2xl border border-black/10 p-5 ${tones[index % tones.length]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">
        {labels[index] ?? "Note"}
      </p>
      <h3 className="mt-3 font-heading text-3xl font-semibold">{note}</h3>
      <p className="mt-3 text-sm leading-6 text-textSecondary">
        A key part of {productName}&apos;s profile, selected to make the scent feel
        recognizable and polished.
      </p>
    </article>
  );
}

function GuideRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-white/70 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-accent">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textSecondary">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-textPrimary">{value}</p>
      </div>
    </div>
  );
}
