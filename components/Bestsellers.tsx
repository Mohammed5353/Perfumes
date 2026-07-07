import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/api/catalog";

export default async function BestSellers() {
  const result = await getProducts({ bestSeller: "true", limit: "2" });

  return (
    <section aria-labelledby="best-sellers">
      <h2
        id="best-sellers"
        className="font-body font-medium text-[1rem] text-textPrimary mb-4"
      >
        Best Selling Product
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 max-w-[550px]">
        {result.data.map((product) => (
          <ProductCard
            key={product.id}
            img={product.image}
            title={product.name}
            price={product.price.toFixed(3)}
            productId={product.id}
          />
        ))}
      </div>
    </section>
  );
}
