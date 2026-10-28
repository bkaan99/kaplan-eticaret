import type { ProductCard as ProductCardData } from "@/modules/catalog/catalog.types";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Bu kriterlere uygun ürün bulunamadı.
      </p>
    );
  }

  return (
    <Stagger
      stagger={0.06}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4"
    >
      {products.map((product) => (
        <StaggerItem key={product.id} className="flex">
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
