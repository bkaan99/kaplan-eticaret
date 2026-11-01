import { desc, eq } from "drizzle-orm";
import { campaign, coupon, dec, type Db } from "@/db";

export interface CouponView {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface CampaignView {
  id: string;
  name: string;
  ruleType: string;
  config: unknown;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface CouponData {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface CampaignData {
  name: string;
  ruleType: string;
  config: object;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface PromotionRepository {
  listCoupons(): Promise<CouponView[]>;
  findCouponByCode(code: string): Promise<{ id: string } | null>;
  findCoupon(
    id: string,
  ): Promise<{ id: string; code: string; usedCount: number } | null>;
  createCoupon(data: CouponData): Promise<string>;
  updateCoupon(id: string, data: CouponData): Promise<void>;
  deleteCoupon(id: string): Promise<void>;
  listCampaigns(): Promise<CampaignView[]>;
  createCampaign(data: CampaignData): Promise<string>;
  updateCampaign(id: string, data: CampaignData): Promise<void>;
  deleteCampaign(id: string): Promise<void>;
}

export class D1PromotionRepository implements PromotionRepository {
  constructor(private readonly db: () => Db) {}

  async listCoupons(): Promise<CouponView[]> {
    const rows = await this.db()
      .select()
      .from(coupon)
      .orderBy(desc(coupon.createdAt));
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value.toFixed(2),
      minSubtotal: row.minSubtotal?.toFixed(2) ?? null,
      maxUses: row.maxUses,
      perCustomerLimit: row.perCustomerLimit,
      usedCount: row.usedCount,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      isActive: row.isActive,
    }));
  }

  async findCouponByCode(code: string) {
    const [row] = await this.db()
      .select({ id: coupon.id })
      .from(coupon)
      .where(eq(coupon.code, code))
      .limit(1);
    return row ?? null;
  }

  async findCoupon(id: string) {
    const [row] = await this.db()
      .select({ id: coupon.id, code: coupon.code, usedCount: coupon.usedCount })
      .from(coupon)
      .where(eq(coupon.id, id))
      .limit(1);
    return row ?? null;
  }

  private couponValues(data: CouponData) {
    return {
      ...data,
      value: dec(data.value),
      minSubtotal: dec(data.minSubtotal),
    };
  }

  async createCoupon(data: CouponData): Promise<string> {
    const [created] = await this.db()
      .insert(coupon)
      .values(this.couponValues(data))
      .returning({ id: coupon.id });
    return created!.id;
  }

  async updateCoupon(id: string, data: CouponData): Promise<void> {
    await this.db()
      .update(coupon)
      .set(this.couponValues(data))
      .where(eq(coupon.id, id));
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.db().delete(coupon).where(eq(coupon.id, id));
  }

  async listCampaigns(): Promise<CampaignView[]> {
    const rows = await this.db()
      .select()
      .from(campaign)
      .orderBy(desc(campaign.createdAt));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ruleType: row.ruleType,
      config: row.config,
      priority: row.priority,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      isActive: row.isActive,
    }));
  }

  async createCampaign(data: CampaignData): Promise<string> {
    const [created] = await this.db()
      .insert(campaign)
      .values(data)
      .returning({ id: campaign.id });
    return created!.id;
  }

  async updateCampaign(id: string, data: CampaignData): Promise<void> {
    await this.db().update(campaign).set(data).where(eq(campaign.id, id));
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.db().delete(campaign).where(eq(campaign.id, id));
  }
}
