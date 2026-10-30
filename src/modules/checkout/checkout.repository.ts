import type Decimal from "decimal.js";
import type { PrismaClient } from "@/shared/prisma-client";
import { PrismaCartRepository, type CartRepository } from "../cart/cart.repository";

export interface CheckoutLineRecord {
  variantId: string;
  quantity: number;
  /** Özelleştirilmiş satırın anahtarı; standart ürünlerde boş */
  customizationKey?: string;
  /** Ham özelleştirme verisi (JSON) */
  customization?: unknown;
  weightGram?: number | null;
  sku: string;
  price: Decimal;
  currency: string;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  desi: number;
  product: {
    name: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    trackInventory: boolean;
    taxRate: Decimal;
    categoryId: string;
    desi: number;
  };
  optionLabels: string[];
}

export interface CouponRecord {
  code: string;
  type: "PERCENT" | "FIXED";
  value: Decimal;
  minSubtotal: Decimal | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface CampaignRecord {
  name: string;
  ruleType: string;
  config: unknown;
  priority: number;
}

export interface CheckoutRepository {
  loadCartLines(cartId: string): Promise<CheckoutLineRecord[]>;
  findCoupon(code: string): Promise<CouponRecord | null>;
  listActiveCampaigns(now: Date): Promise<CampaignRecord[]>;
}

export class PrismaCheckoutRepository implements CheckoutRepository {
  private readonly carts: Pick<CartRepository, "listItems">;

  constructor(
    private readonly db: () => PrismaClient,
    carts?: Pick<CartRepository, "listItems">,
  ) {
    this.carts = carts ?? new PrismaCartRepository(db);
  }

  async loadCartLines(cartId: string): Promise<CheckoutLineRecord[]> {
    const items = await this.carts.listItems(cartId);
    return items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      customizationKey: item.customizationKey,
      customization: item.customization,
      weightGram: item.weightGram,
      sku: item.sku,
      price: item.price,
      currency: item.currency,
      isActive: item.isActive,
      stockQuantity: item.stockQuantity,
      reservedQuantity: item.reservedQuantity,
      desi: item.desi ?? 0,
      product: {
        name: item.product.name,
        status: item.product.status,
        trackInventory: item.product.trackInventory,
        taxRate: item.product.taxRate ?? item.price,
        categoryId: item.product.categoryId ?? "",
        desi: item.product.desi ?? 0,
      },
      optionLabels: item.optionLabels,
    }));
  }

  async findCoupon(code: string): Promise<CouponRecord | null> {
    const coupon = await this.db().coupon.findUnique({ where: { code } });
    return coupon;
  }

  async listActiveCampaigns(now: Date): Promise<CampaignRecord[]> {
    const rows = await this.db().campaign.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { priority: "desc" },
    });

    return rows.map((row) => ({
      name: row.name,
      ruleType: row.ruleType,
      config: row.config,
      priority: row.priority,
    }));
  }
}
