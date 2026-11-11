import type { ProductCard as ProductCardData } from "@/modules/catalog/catalog.types";
import { ProductCard } from "./product-card";
import { ProductGridInteractions } from "./product-grid-interactions";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Bu kriterlere uygun ürün bulunamadı.
      </p>
    );
  }

  return (
    <ProductGridInteractions className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <div key={product.id} className="flex">
          <ProductCard product={product} />
        </div>
      ))}
    </ProductGridInteractions>
  );
}
