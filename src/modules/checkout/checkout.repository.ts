import type Decimal from "decimal.js";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { campaign, coupon, type Db } from "@/db";
import { D1CartRepository, type CartRepository } from "../cart/cart.repository";

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

export class D1CheckoutRepository implements CheckoutRepository {
  private readonly carts: Pick<CartRepository, "listItems">;

  constructor(
    private readonly db: () => Db,
    carts?: Pick<CartRepository, "listItems">,
  ) {
    this.carts = carts ?? new D1CartRepository(db);
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
    const [row] = await this.db()
      .select()
      .from(coupon)
      .where(eq(coupon.code, code))
      .limit(1);
    return row ?? null;
  }

  async listActiveCampaigns(now: Date): Promise<CampaignRecord[]> {
    const rows = await this.db()
      .select()
      .from(campaign)
      .where(
        and(
          eq(campaign.isActive, true),
          or(isNull(campaign.startsAt), lte(campaign.startsAt, now)),
          or(isNull(campaign.endsAt), gte(campaign.endsAt, now)),
        ),
      )
      .orderBy(desc(campaign.priority));

    return rows.map((row) => ({
      name: row.name,
      ruleType: row.ruleType,
      config: row.config,
      priority: row.priority,
    }));
  }
}
