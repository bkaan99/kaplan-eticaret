import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import {
  containsText,
  customerGroup,
  dec,
  newId,
  product,
  productVariant,
  runBatch,
  tierPrice,
  variantGroupPrice,
  type Db,
} from "@/db";

export interface GroupRow {
  id: string;
  name: string;
  slug: string;
  discountPercent: string | null;
  customerCount: number;
}

export interface VariantPriceRow {
  variantId: string;
  sku: string;
  productName: string;
  optionLabel: string;
  listPrice: string;
  groupPrice: string | null;
  /** Bu gruba özel kademeler */
  groupTiers: { minQuantity: number; price: string }[];
  /** Tüm müşterilere uygulanan genel kademeler (salt okunur) */
  generalTiers: { minQuantity: number; price: string }[];
}

export interface PriceListRepository {
  listGroups(): Promise<GroupRow[]>;
  findGroup(id: string): Promise<GroupRow | null>;
  groupSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  createGroup(
    name: string,
    slug: string,
    discountPercent: number | null,
  ): Promise<string>;
  updateGroup(
    id: string,
    name: string,
    discountPercent: number | null,
  ): Promise<void>;
  deleteGroup(id: string): Promise<void>;
  searchVariants(
    groupId: string,
    query: string,
    limit: number,
  ): Promise<VariantPriceRow[]>;
  variantExists(variantId: string): Promise<boolean>;
  setGroupPrice(
    groupId: string,
    variantId: string,
    price: number | null,
  ): Promise<void>;
  replaceTiers(
    variantId: string,
    groupId: string | null,
    tiers: { minQuantity: number; price: number }[],
  ): Promise<void>;
}

/** `column = value` ya da değer null ise `column IS NULL`. */
function eqOrNull(
  column: Parameters<typeof eq>[0] & SQLWrapper,
  value: string | null,
): SQL {
  return value === null ? isNull(column) : eq(column, value);
}

export class D1PriceListRepository implements PriceListRepository {
  constructor(private readonly db: () => Db) {}

  private groupColumns() {
    return {
      id: customerGroup.id,
      name: customerGroup.name,
      slug: customerGroup.slug,
      discountPercent: customerGroup.discountPercent,
      customerCount: sql<number>`(SELECT count(*) FROM "Customer" WHERE "Customer"."groupId" = ${customerGroup.id})`,
    };
  }

  private toGroup(row: {
    id: string;
    name: string;
    slug: string;
    discountPercent: { toString(): string } | null;
    customerCount: number;
  }): GroupRow {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      discountPercent: row.discountPercent?.toString() ?? null,
      customerCount: Number(row.customerCount),
    };
  }

  async listGroups(): Promise<GroupRow[]> {
    const rows = await this.db()
      .select(this.groupColumns())
      .from(customerGroup)
      .orderBy(asc(customerGroup.name));
    return rows.map((row) => this.toGroup(row));
  }

  async findGroup(id: string): Promise<GroupRow | null> {
    const [row] = await this.db()
      .select(this.groupColumns())
      .from(customerGroup)
      .where(eq(customerGroup.id, id))
      .limit(1);
    return row ? this.toGroup(row) : null;
  }

  async groupSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const [found] = await this.db()
      .select({ id: customerGroup.id })
      .from(customerGroup)
      .where(
        and(
          eq(customerGroup.slug, slug),
          excludeId ? ne(customerGroup.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return found !== undefined;
  }

  async createGroup(
    name: string,
    slug: string,
    discountPercent: number | null,
  ): Promise<string> {
    const [created] = await this.db()
      .insert(customerGroup)
      .values({ name, slug, discountPercent: dec(discountPercent) })
      .returning({ id: customerGroup.id });
    return created!.id;
  }

  async updateGroup(
    id: string,
    name: string,
    discountPercent: number | null,
  ): Promise<void> {
    await this.db()
      .update(customerGroup)
      .set({ name, discountPercent: dec(discountPercent) })
      .where(eq(customerGroup.id, id));
  }

  async deleteGroup(id: string): Promise<void> {
    await this.db().delete(customerGroup).where(eq(customerGroup.id, id));
  }

  async searchVariants(
    groupId: string,
    query: string,
    limit: number,
  ): Promise<VariantPriceRow[]> {
    const db = this.db();
    const term = query.trim();

    // Sıralama ürün adına göre olduğundan önce sıralı kimlikler alınır, ilişkiler sonra yüklenir.
    const ordered = await db
      .select({ id: productVariant.id })
      .from(productVariant)
      .innerJoin(product, eq(product.id, productVariant.productId))
      .where(
        and(
          eq(productVariant.isActive, true),
          term
            ? or(
                containsText(productVariant.sku, term),
                containsText(product.name, term),
              )
            : undefined,
        ),
      )
      .orderBy(asc(product.name), asc(productVariant.sku))
      .limit(limit);
    if (ordered.length === 0) return [];

    const variants = await db.query.productVariant.findMany({
      where: inArray(
        productVariant.id,
        ordered.map((row) => row.id),
      ),
      with: {
        product: { columns: { name: true } },
        optionValues: { with: { optionValue: true } },
        groupPrices: { where: eq(variantGroupPrice.groupId, groupId) },
        tierPrices: {
          where: or(eq(tierPrice.groupId, groupId), isNull(tierPrice.groupId)),
          orderBy: asc(tierPrice.minQuantity),
        },
      },
    });
    const position = new Map(ordered.map((row, index) => [row.id, index]));
    variants.sort((a, b) => position.get(a.id)! - position.get(b.id)!);

    return variants.map((variant) => ({
      variantId: variant.id,
      sku: variant.sku,
      productName: variant.product.name,
      optionLabel: variant.optionValues
        .map((link) => link.optionValue.value)
        .join(" / "),
      listPrice: variant.price.toFixed(2),
      groupPrice: variant.groupPrices[0]?.price.toFixed(2) ?? null,
      groupTiers: variant.tierPrices
        .filter((tier) => tier.groupId === groupId)
        .map((tier) => ({
          minQuantity: tier.minQuantity,
          price: tier.price.toFixed(2),
        })),
      generalTiers: variant.tierPrices
        .filter((tier) => tier.groupId === null)
        .map((tier) => ({
          minQuantity: tier.minQuantity,
          price: tier.price.toFixed(2),
        })),
    }));
  }

  async variantExists(variantId: string): Promise<boolean> {
    const [row] = await this.db()
      .select({ id: productVariant.id })
      .from(productVariant)
      .where(eq(productVariant.id, variantId))
      .limit(1);
    return row !== undefined;
  }

  async setGroupPrice(
    groupId: string,
    variantId: string,
    price: number | null,
  ): Promise<void> {
    const db = this.db();
    if (price === null) {
      await db
        .delete(variantGroupPrice)
        .where(
          and(
            eq(variantGroupPrice.groupId, groupId),
            eq(variantGroupPrice.variantId, variantId),
          ),
        );
      return;
    }

    await db
      .insert(variantGroupPrice)
      .values({ variantId, groupId, price: dec(price) })
      .onConflictDoUpdate({
        target: [variantGroupPrice.variantId, variantGroupPrice.groupId],
        set: { price: dec(price) },
      });
  }

  async replaceTiers(
    variantId: string,
    groupId: string | null,
    tiers: { minQuantity: number; price: number }[],
  ): Promise<void> {
    const db = this.db();
    // Silme + ekleme tek batch'te (satır başına ekleme: D1 sorgu başına 100 parametre sınırı).
    await runBatch(db, [
      db
        .delete(tierPrice)
        .where(
          and(
            eq(tierPrice.variantId, variantId),
            eqOrNull(tierPrice.groupId, groupId),
          ),
        ),
      ...tiers.map((tier) =>
        db.insert(tierPrice).values({
          id: newId(),
          variantId,
          groupId,
          minQuantity: tier.minQuantity,
          price: dec(tier.price),
        }),
      ),
    ]);
  }
}
