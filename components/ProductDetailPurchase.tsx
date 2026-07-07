"use client";

import ProductDetailActions from "@/components/ProductDetailActions";

type ProductVariant = {
  id: string;
  name: string;
  image: string;
  price: number;
};

type ProductDetailPurchaseProps = {
  productId: string;
  name: string;
  image: string;
  price: number;
  notes: string;
  tag?: string | null;
  slug?: string;
  isWishlisted?: boolean;
  scentOptions: string[];
  variants?: ProductVariant[];
  selectedScent?: string;
  hideSelector?: boolean;
};

export default function ProductDetailPurchase({
  productId,
  name,
  image,
  price,
  notes,
  tag,
  slug,
  isWishlisted,
  scentOptions,
  variants = [],
  selectedScent: controlledSelectedScent,
  hideSelector = false,
}: ProductDetailPurchaseProps) {
  const hasVariants = variants.length > 0;
  const initialOption = hasVariants ? variants[0]?.name ?? "" : scentOptions[0] ?? "";
  const selectedScent = controlledSelectedScent ?? initialOption;

  const activeVariant = hasVariants
    ? variants.find((variant) => variant.name === selectedScent) ?? variants[0] ?? null
    : null;

  const showSelector = hasVariants ? variants.length > 0 : scentOptions.length > 1;
  const activeProductId = activeVariant?.id ?? productId;
  const activeImage = activeVariant?.image ?? image;
  const activePrice = activeVariant?.price ?? price;

  return (
    <>
      <div className="mt-7">
        <ProductDetailActions
          productId={activeProductId}
          name={name}
          image={activeImage}
          price={activePrice}
          notes={notes}
          tag={tag}
          slug={slug}
          isWishlisted={isWishlisted}
          selectedScent={showSelector && !hideSelector ? selectedScent : undefined}
        />
      </div>
    </>
  );
}
