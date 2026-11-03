import type Decimal from "decimal.js";
import { and, asc, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { cart, cartItem, productVariant, runBatch, type Db } from "@/db";

export interface CartRecord {
  id: string;
  userId: string | null;
  sessionToken: string | null;
}

export interface CartItemRecord {
  variantId: string;
  quantity: number;
  /** Özelleştirilmiş satırın anahtarı; standart ürünlerde boş */
  customizationKey?: string;
  /** Ham özelleştirme verisi (JSON) */
  customization?: unknown;
  weightGram?: number | null;
  desi?: number;
  sku: string;
  price: Decimal;
  currency: string;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    trackInventory: boolean;
    imageUrl: string | null;
    taxRate?: Decimal;
    categoryId?: string;
    desi?: number;
  };
  optionLabels: string[];
}

export interface VariantStockRecord {
  variantId: string;
  productSlug?: string;
  isActive: boolean;
  productActive: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  reservedQuantity: number;
}

/** Özelleştirilmiş satırın anahtarı ve verisi. */
export interface CartLineCustomization {
  key: string;
  customization: unknown;
}

export interface CartRepository {
  findByUserId(userId: string): Promise<CartRecord | null>;
  findByToken(token: string): Promise<CartRecord | null>;
  create(data: { userId?: string; sessionToken?: string }): Promise<CartRecord>;
  delete(cartId: string): Promise<void>;
  listItems(cartId: string): Promise<CartItemRecord[]>;
  getItemQuantity(
    cartId: string,
    variantId: string,
    customizationKey?: string,
  ): Promise<number>;
  setItemQuantity(
    cartId: string,
    variantId: string,
    quantity: number,
    line?: CartLineCustomization,
  ): Promise<void>;
  removeItem(
    cartId: string,
    variantId: string,
    customizationKey?: string,
  ): Promise<void>;
  findVariantStock(variantId: string): Promise<VariantStockRecord | null>;
  /** Kaynak sepetin satırlarını hedefe ekler (aynı varyantta adetler toplanır). */
  moveItems(
    fromCartId: string,
    toCartId: string,
    maxQuantity: number,
  ): Promise<void>;
  /** Terk edilmiş sahipsiz (anonim) sepetleri ve satırlarını temizler. */
  purgeAbandoned(olderThan: Date): Promise<number>;
}

const cartColumns = {
  id: cart.id,
  userId: cart.userId,
  sessionToken: cart.sessionToken,
} as const;

export class D1CartRepository implements CartRepository {
  constructor(private readonly db: () => Db) {}

  async findByUserId(userId: string): Promise<CartRecord | null> {
    const [row] = await this.db()
      .select(cartColumns)
      .from(cart)
      .where(eq(cart.userId, userId))
      .orderBy(desc(cart.updatedAt))
      .limit(1);
    return row ?? null;
  }

  async findByToken(token: string): Promise<CartRecord | null> {
    const [row] = await this.db()
      .select(cartColumns)
      .from(cart)
      .where(eq(cart.sessionToken, token))
      .limit(1);
    return row ?? null;
  }

  async create(data: {
    userId?: string;
    sessionToken?: string;
  }): Promise<CartRecord> {
    const [row] = await this.db()
      .insert(cart)
      .values({ userId: data.userId, sessionToken: data.sessionToken })
      .returning(cartColumns);
    return row!;
  }

  async delete(cartId: string): Promise<void> {
    await this.db().delete(cart).where(eq(cart.id, cartId));
  }

  async listItems(cartId: string): Promise<CartItemRecord[]> {
    const rows = await this.db().query.cartItem.findMany({
      where: eq(cartItem.cartId, cartId),
      orderBy: asc(cartItem.createdAt),
      with: {
        variant: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                status: true,
                trackInventory: true,
                taxRate: true,
                categoryId: true,
                desi: true,
              },
              with: {
                images: {
                  orderBy: (image, { asc }) => asc(image.position),
                  limit: 1,
                  columns: { url: true },
                },
              },
            },
            optionValues: { with: { optionValue: { with: { option: true } } } },
          },
        },
      },
    });

    return rows.map((row) => {
      const variant = row.variant;
      const desi = variant.desi ?? variant.product.desi;

      return {
        variantId: row.variantId,
        quantity: row.quantity,
        customizationKey: row.customizationKey,
        customization: row.customization,
        weightGram: variant.weightGram,
        desi: desi ? Number(desi) : 0,
        sku: variant.sku,
        price: variant.price,
        currency: variant.currency,
        isActive: variant.isActive,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
        product: {
          id: variant.product.id,
          name: variant.product.name,
          slug: variant.product.slug,
          status: variant.product.status,
          trackInventory: variant.product.trackInventory,
          imageUrl: variant.product.images[0]?.url ?? null,
          taxRate: variant.product.taxRate,
          categoryId: variant.product.categoryId,
          desi: variant.product.desi ? Number(variant.product.desi) : 0,
        },
        optionLabels: variant.optionValues
          .sort(
            (a, b) =>
              a.optionValue.option.position - b.optionValue.option.position,
          )
          .map((item) => item.optionValue.value),
      };
    });
  }

  async getItemQuantity(
    cartId: string,
    variantId: string,
    customizationKey = "",
  ): Promise<number> {
    const [item] = await this.db()
      .select({ quantity: cartItem.quantity })
      .from(cartItem)
      .where(lineKey(cartId, variantId, customizationKey))
      .limit(1);
    return item?.quantity ?? 0;
  }

  async setItemQuantity(
    cartId: string,
    variantId: string,
    quantity: number,
    line?: CartLineCustomization,
  ): Promise<void> {
    const db = this.db();
    const customizationKey = line?.key ?? "";
    await runBatch(db, [
      db
        .insert(cartItem)
        .values({
          cartId,
          variantId,
          quantity,
          customizationKey,
          customization: line ? line.customization : undefined,
        })
        .onConflictDoUpdate({
          target: [
            cartItem.cartId,
            cartItem.variantId,
            cartItem.customizationKey,
          ],
          set: { quantity },
        }),
      db.update(cart).set({ updatedAt: new Date() }).where(eq(cart.id, cartId)),
    ]);
  }

  async removeItem(
    cartId: string,
    variantId: string,
    customizationKey = "",
  ): Promise<void> {
    await this.db()
      .delete(cartItem)
      .where(lineKey(cartId, variantId, customizationKey));
  }

  async findVariantStock(
    variantId: string,
  ): Promise<VariantStockRecord | null> {
    const variant = await this.db().query.productVariant.findFirst({
      where: eq(productVariant.id, variantId),
      columns: {
        id: true,
        isActive: true,
        stockQuantity: true,
        reservedQuantity: true,
      },
      with: {
        product: {
          columns: { status: true, trackInventory: true, slug: true },
        },
      },
    });
    if (!variant) return null;

    return {
      variantId: variant.id,
      productSlug: variant.product.slug,
      isActive: variant.isActive,
      productActive: variant.product.status === "ACTIVE",
      trackInventory: variant.product.trackInventory,
      stockQuantity: variant.stockQuantity,
      reservedQuantity: variant.reservedQuantity,
    };
  }

  async moveItems(
    fromCartId: string,
    toCartId: string,
    maxQuantity: number,
  ): Promise<void> {
    const db = this.db();
    const items = await db
      .select()
      .from(cartItem)
      .where(eq(cartItem.cartId, fromCartId));
    if (items.length === 0) {
      await db.delete(cart).where(eq(cart.id, fromCartId));
      return;
    }

    const existingItems = await db
      .select()
      .from(cartItem)
      .where(eq(cartItem.cartId, toCartId));
    const existingByKey = new Map(
      existingItems.map((e) => [
        `${e.variantId}\u0000${e.customizationKey}`,
        e,
      ]),
    );

    // Tüm işlemler önceden bilinir: tek batch (atomik).
    const ops = items.map((item) => {
      const existing = existingByKey.get(
        `${item.variantId}\u0000${item.customizationKey}`,
      );
      const quantity = Math.min(
        maxQuantity,
        item.quantity + (existing?.quantity ?? 0),
      );

      return db
        .insert(cartItem)
        .values({
          cartId: toCartId,
          variantId: item.variantId,
          quantity,
          customizationKey: item.customizationKey,
          customization: item.customization ?? undefined,
        })
        .onConflictDoUpdate({
          target: [
            cartItem.cartId,
            cartItem.variantId,
            cartItem.customizationKey,
          ],
          set: { quantity },
        });
    });

    await runBatch(db, [
      ...ops,
      db.delete(cart).where(eq(cart.id, fromCartId)),
    ]);
  }

  async purgeAbandoned(olderThan: Date): Promise<number> {
    const db = this.db();
    const expiredCarts = await db
      .select({ id: cart.id })
      .from(cart)
      .where(and(isNull(cart.userId), lt(cart.updatedAt, olderThan)));

    if (expiredCarts.length === 0) {
      return 0;
    }

    const ids = expiredCarts.map((r) => r.id);
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await runBatch(db, [
        db.delete(cartItem).where(inArray(cartItem.cartId, chunk)),
        db.delete(cart).where(inArray(cart.id, chunk)),
      ]);
    }

    return ids.length;
  }
}

function lineKey(cartId: string, variantId: string, customizationKey: string) {
  return and(
    eq(cartItem.cartId, cartId),
    eq(cartItem.variantId, variantId),
    eq(cartItem.customizationKey, customizationKey),
  );
}
