import { inArray, sql } from "drizzle-orm";
import { brand, category, chunk, product, productVariant, type Db } from "@/db";
import type { ImportRepository } from "./product-import.service";

export class D1ImportRepository implements ImportRepository {
  constructor(private readonly db: () => Db) {}

  async taxonomy() {
    const db = this.db();
    const [categories, brands] = await Promise.all([
      db
        .select({ id: category.id, name: category.name, slug: category.slug })
        .from(category),
      db.select({ id: brand.id, name: brand.name }).from(brand),
    ]);
    return { categories, brands };
  }

  async existingSkus(skus: string[]): Promise<string[]> {
    const found: string[] = [];
    // Uzun listeler D1 parametre sınırı için parçalanır.
    for (const part of chunk(skus)) {
      const rows = await this.db()
        .select({ sku: productVariant.sku })
        .from(productVariant)
        // SKU eşleşmesi büyük/küçük harfe duyarsızdır.
        .where(
          inArray(
            sql`upper(${productVariant.sku})`,
            part.map((sku) => sku.toUpperCase()),
          ),
        );
      found.push(...rows.map((row) => row.sku));
    }
    return found;
  }

  async existingSlugs(slugs: string[]): Promise<string[]> {
    const found: string[] = [];
    for (const part of chunk(slugs)) {
      const rows = await this.db()
        .select({ slug: product.slug })
        .from(product)
        .where(inArray(product.slug, part));
      found.push(...rows.map((row) => row.slug));
    }
    return found;
  }
}
