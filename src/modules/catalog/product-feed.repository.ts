import { and, eq, ne } from "drizzle-orm";
import { product, productVariant, type Db } from "@/db";
import { validGtin } from "@/shared/seo/gtin";
import { CUSTOM_PICKLE_PRODUCT_SLUG } from "@/modules/custom-pickle/custom-pickle.types";
import type { CategoryNode } from "./catalog.types";
import { buildBreadcrumbs } from "./category-tree";
import type { FeedProduct } from "./product-feed";

/**
 * Beslemeye giren ürünler: yayında, en az bir aktif varyantı olan ürünler.
 * "Kendi Turşunu Yap" bidonu fiyatı sihirbazda belirlendiği için hariçtir.
 * Fiyatlar perakende (liste) fiyatıdır; bayi/grup fiyatı beslemeye girmez.
 */
export async function listFeedProducts(
  db: Db,
  categories: readonly CategoryNode[],
  absolute: (url: string) => string,
): Promise<FeedProduct[]> {
  const rows = await db.query.product.findMany({
    where: and(
      eq(product.status, "ACTIVE"),
      ne(product.slug, CUSTOM_PICKLE_PRODUCT_SLUG),
    ),
    columns: {
      id: true,
      slug: true,
      name: true,
      description: true,
      categoryId: true,
      trackInventory: true,
      weightGram: true,
    },
    with: {
      brand: { columns: { name: true } },
      images: {
        orderBy: (image, { asc }) => asc(image.position),
        columns: { url: true, optionValueId: true },
      },
      variants: {
        where: eq(productVariant.isActive, true),
        orderBy: (variant, { asc }) => asc(variant.price),
        with: {
          optionValues: {
            with: { optionValue: { columns: { id: true, value: true } } },
          },
        },
      },
    },
  });

  return rows
    .filter((row) => row.variants.length > 0)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      brandName: row.brand?.name ?? null,
      productType:
        buildBreadcrumbs(categories, row.categoryId)
          .map((crumb) => crumb.name)
          .join(" > ") || null,
      trackInventory: row.trackInventory,
      weightGram: row.weightGram,
      imageUrls: row.images
        .filter((image) => image.optionValueId === null)
        .map((image) => absolute(image.url)),
      variants: row.variants.map((variant) => {
        const valueIds = new Set(
          variant.optionValues.map((item) => item.optionValueId),
        );
        const variantImage = row.images.find(
          (image) => image.optionValueId && valueIds.has(image.optionValueId),
        );
        const optionLabel = variant.optionValues
          .map((item) => item.optionValue.value)
          .join(" / ");
        return {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          currency: variant.currency,
          stockQuantity: variant.stockQuantity,
          reservedQuantity: variant.reservedQuantity,
          gtin: validGtin(variant.barcode),
          optionLabel: optionLabel || null,
          imageUrl: variantImage ? absolute(variantImage.url) : null,
        };
      }),
    }));
}
