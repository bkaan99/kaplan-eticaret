import { eq, inArray, sql } from "drizzle-orm";
import { chunk, dec, productVariant, runBatch, type Db } from "@/db";
import type {
  BulkUpdateRepository,
  VariantSnapshot,
  VariantUpdate,
} from "./bulk-update.service";

export class D1BulkUpdateRepository implements BulkUpdateRepository {
  constructor(private readonly db: () => Db) {}

  async findVariantsBySku(skus: string[]): Promise<VariantSnapshot[]> {
    const snapshots: VariantSnapshot[] = [];
    // Uzun listeler D1 parametre sınırı için parçalanır.
    for (const part of chunk(skus)) {
      const rows = await this.db()
        .select({
          id: productVariant.id,
          sku: productVariant.sku,
          price: productVariant.price,
          compareAtPrice: productVariant.compareAtPrice,
          stockQuantity: productVariant.stockQuantity,
        })
        .from(productVariant)
        // SKU eşleşmesi büyük/küçük harfe duyarsızdır (servis anahtarları büyük harfe çevirir).
        .where(
          inArray(
            sql`upper(${productVariant.sku})`,
            part.map((sku) => sku.toUpperCase()),
          ),
        );

      snapshots.push(
        ...rows.map((row) => ({
          id: row.id,
          sku: row.sku,
          price: row.price.toFixed(2),
          compareAtPrice: row.compareAtPrice?.toFixed(2) ?? null,
          stockQuantity: row.stockQuantity,
        })),
      );
    }
    return snapshots;
  }

  async applyUpdates(updates: VariantUpdate[]): Promise<void> {
    if (updates.length === 0) return;
    const db = this.db();
    // Tüm güncellemeler önceden bilinir: tek batch (atomik).
    await runBatch(
      db,
      updates.map((update) =>
        db
          .update(productVariant)
          .set({
            ...(update.price !== undefined ? { price: dec(update.price) } : {}),
            ...(update.compareAtPrice !== undefined
              ? { compareAtPrice: dec(update.compareAtPrice) }
              : {}),
            ...(update.stockQuantity !== undefined
              ? { stockQuantity: update.stockQuantity }
              : {}),
          })
          .where(eq(productVariant.id, update.id)),
      ),
    );
  }
}
