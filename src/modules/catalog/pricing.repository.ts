import { and, eq, inArray, isNull, or } from "drizzle-orm";
import type Decimal from "decimal.js";
import { customerGroup, tierPrice, variantGroupPrice, type Db } from "@/db";
import type { PricingRepository, TierPriceRecord } from "./pricing";

export class D1PricingRepository implements PricingRepository {
  constructor(private readonly db: () => Db) {}

  async groupPrices(
    groupId: string,
    variantIds: string[],
  ): Promise<Map<string, Decimal>> {
    if (variantIds.length === 0) return new Map();
    const rows = await this.db()
      .select()
      .from(variantGroupPrice)
      .where(
        and(
          eq(variantGroupPrice.groupId, groupId),
          inArray(variantGroupPrice.variantId, variantIds),
        ),
      );
    return new Map(rows.map((row) => [row.variantId, row.price]));
  }

  async groupDiscountPercent(groupId: string): Promise<Decimal | null> {
    const [group] = await this.db()
      .select({ discountPercent: customerGroup.discountPercent })
      .from(customerGroup)
      .where(eq(customerGroup.id, groupId))
      .limit(1);
    return group?.discountPercent ?? null;
  }

  async tierPrices(
    variantIds: string[],
    groupId: string | null,
  ): Promise<Map<string, TierPriceRecord[]>> {
    if (variantIds.length === 0) return new Map();
    const rows = await this.db()
      .select()
      .from(tierPrice)
      .where(
        and(
          inArray(tierPrice.variantId, variantIds),
          or(
            isNull(tierPrice.groupId),
            groupId ? eq(tierPrice.groupId, groupId) : undefined,
          ),
        ),
      );

    const result = new Map<string, TierPriceRecord[]>();
    for (const row of rows) {
      const list = result.get(row.variantId) ?? [];
      list.push({ minQuantity: row.minQuantity, price: row.price });
      result.set(row.variantId, list);
    }
    return result;
  }
}
