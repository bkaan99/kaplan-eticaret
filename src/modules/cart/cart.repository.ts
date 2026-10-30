import type Decimal from "decimal.js";
import type { Prisma } from "../../../generated/prisma/client";
import type { PrismaClient } from "@/shared/prisma-client";

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
}

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly db: () => PrismaClient) {}

  findByUserId(userId: string): Promise<CartRecord | null> {
    return this.db().cart.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, userId: true, sessionToken: true },
    });
  }

  findByToken(token: string): Promise<CartRecord | null> {
    return this.db().cart.findUnique({
      where: { sessionToken: token },
      select: { id: true, userId: true, sessionToken: true },
    });
  }

  create(data: {
    userId?: string;
    sessionToken?: string;
  }): Promise<CartRecord> {
    return this.db().cart.create({
      data: { userId: data.userId, sessionToken: data.sessionToken },
      select: { id: true, userId: true, sessionToken: true },
    });
  }

  async delete(cartId: string): Promise<void> {
    await this.db().cart.deleteMany({ where: { id: cartId } });
  }

  async listItems(cartId: string): Promise<CartItemRecord[]> {
    const rows = await this.db().cartItem.findMany({
      where: { cartId },
      orderBy: { createdAt: "asc" },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                trackInventory: true,
                taxRate: true,
                categoryId: true,
                desi: true,
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
            optionValues: {
              include: { optionValue: { include: { option: true } } },
            },
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
    const item = await this.db().cartItem.findUnique({
      where: {
        cartId_variantId_customizationKey: {
          cartId,
          variantId,
          customizationKey,
        },
      },
      select: { quantity: true },
    });
    return item?.quantity ?? 0;
  }

  async setItemQuantity(
    cartId: string,
    variantId: string,
    quantity: number,
    line?: CartLineCustomization,
  ): Promise<void> {
    const customizationKey = line?.key ?? "";
    await this.db().cartItem.upsert({
      where: {
        cartId_variantId_customizationKey: {
          cartId,
          variantId,
          customizationKey,
        },
      },
      update: { quantity },
      create: {
        cartId,
        variantId,
        quantity,
        customizationKey,
        customization: line
          ? (line.customization as Prisma.InputJsonValue)
          : undefined,
      },
    });
    await this.db().cart.update({
      where: { id: cartId },
      data: { updatedAt: new Date() },
    });
  }

  async removeItem(
    cartId: string,
    variantId: string,
    customizationKey = "",
  ): Promise<void> {
    await this.db().cartItem.deleteMany({
      where: { cartId, variantId, customizationKey },
    });
  }

  async findVariantStock(
    variantId: string,
  ): Promise<VariantStockRecord | null> {
    const variant = await this.db().productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        isActive: true,
        stockQuantity: true,
        reservedQuantity: true,
        product: {
          select: { status: true, trackInventory: true, slug: true },
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
    await this.db().$transaction(async (tx) => {
      const items = await tx.cartItem.findMany({
        where: { cartId: fromCartId },
      });

      for (const item of items) {
        const where = {
          cartId_variantId_customizationKey: {
            cartId: toCartId,
            variantId: item.variantId,
            customizationKey: item.customizationKey,
          },
        };
        const existing = await tx.cartItem.findUnique({ where });
        const quantity = Math.min(
          maxQuantity,
          item.quantity + (existing?.quantity ?? 0),
        );

        await tx.cartItem.upsert({
          where,
          update: { quantity },
          create: {
            cartId: toCartId,
            variantId: item.variantId,
            quantity,
            customizationKey: item.customizationKey,
            customization: item.customization ?? undefined,
          },
        });
      }

      await tx.cart.deleteMany({ where: { id: fromCartId } });
    });
  }
}
