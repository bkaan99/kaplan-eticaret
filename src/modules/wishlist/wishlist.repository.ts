import { and, desc, eq, inArray } from "drizzle-orm";
import { product, wishlistItem, type Db } from "@/db";

export interface WishlistRepository {
  listProductIds(userId: string): Promise<string[]>;
  add(userId: string, productId: string): Promise<void>;
  remove(userId: string, productId: string): Promise<void>;
  /** Yalnızca yayında olan ürünlerin kimliklerini döndürür. */
  filterActiveProductIds(productIds: string[]): Promise<string[]>;
}

export class D1WishlistRepository implements WishlistRepository {
  constructor(private readonly db: () => Db) {}

  async listProductIds(userId: string): Promise<string[]> {
    const rows = await this.db()
      .select({ productId: wishlistItem.productId })
      .from(wishlistItem)
      .innerJoin(product, eq(product.id, wishlistItem.productId))
      .where(and(eq(wishlistItem.userId, userId), eq(product.status, "ACTIVE")))
      .orderBy(desc(wishlistItem.createdAt));
    return rows.map((row) => row.productId);
  }

  async add(userId: string, productId: string): Promise<void> {
    await this.db()
      .insert(wishlistItem)
      .values({ userId, productId })
      .onConflictDoNothing();
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.db()
      .delete(wishlistItem)
      .where(
        and(
          eq(wishlistItem.userId, userId),
          eq(wishlistItem.productId, productId),
        ),
      );
  }

  async filterActiveProductIds(productIds: string[]): Promise<string[]> {
    if (productIds.length === 0) return [];
    const rows = await this.db()
      .select({ id: product.id })
      .from(product)
      .where(
        and(inArray(product.id, productIds), eq(product.status, "ACTIVE")),
      );
    return rows.map((row) => row.id);
  }
}
