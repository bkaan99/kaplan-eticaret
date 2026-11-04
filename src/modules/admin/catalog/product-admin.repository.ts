import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ne,
  notInArray,
  or,
} from "drizzle-orm";
import {
  attribute,
  brand,
  category,
  containsText,
  dec,
  newId,
  product,
  productAttributeValue,
  productImage,
  productOption,
  productOptionValue,
  productVariant,
  redirect,
  runBatch,
  variantOptionValue,
  type Db,
} from "@/db";
import type { ProductInput } from "./product.schema";

export interface ProductListQuery {
  search?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId?: string;
  page: number;
  pageSize: number;
}

export interface ProductListRow {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryName: string;
  variantCount: number;
  totalStock: number;
  minPrice: string | null;
  imageUrl: string | null;
  updatedAt: Date;
}

export interface ProductListResult {
  items: ProductListRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EditableProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId: string;
  brandId: string | null;
  taxRate: string;
  trackInventory: boolean;
  isFeatured: boolean;
  desi: string | null;
  weightGram: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ingredients: string | null;
  allergens: string | null;
  shelfLife: string | null;
  attributeValueIds: string[];
  options: { name: string; values: string[] }[];
  variants: {
    id: string;
    sku: string;
    barcode: string | null;
    price: string;
    compareAtPrice: string | null;
    stockQuantity: number;
    reservedQuantity: number;
    isActive: boolean;
    optionValues: Record<string, string>;
  }[];
  images: {
    url: string;
    alt: string | null;
    forOption: { option: string; value: string } | null;
  }[];
}

export interface FormReferences {
  categories: { id: string; label: string }[];
  brands: { id: string; name: string }[];
  attributes: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
}

export interface ProductAdminRepository {
  list(query: ProductListQuery): Promise<ProductListResult>;
  findForEdit(id: string): Promise<EditableProduct | null>;
  references(): Promise<FormReferences>;
  slugTaken(slug: string, excludeId?: string): Promise<boolean>;
  create(input: ProductInput, slug: string): Promise<string>;
  update(id: string, input: ProductInput, slug: string): Promise<void>;
  addRedirect(fromPath: string, toPath: string): Promise<void>;
}

type BatchOps = Parameters<typeof runBatch>[1];

export class D1ProductAdminRepository implements ProductAdminRepository {
  constructor(private readonly db: () => Db) {}

  async list(query: ProductListQuery): Promise<ProductListResult> {
    const db = this.db();
    const search = query.search?.trim();
    const where = and(
      query.status ? eq(product.status, query.status) : undefined,
      query.categoryId ? eq(product.categoryId, query.categoryId) : undefined,
      search
        ? or(
            containsText(product.name, search),
            exists(
              db
                .select({ one: productVariant.id })
                .from(productVariant)
                .where(
                  and(
                    eq(productVariant.productId, product.id),
                    containsText(productVariant.sku, search),
                  ),
                ),
            ),
          )
        : undefined,
    );

    const [[totalRow], rows] = await Promise.all([
      db.select({ n: count() }).from(product).where(where),
      db.query.product.findMany({
        where,
        orderBy: desc(product.updatedAt),
        offset: (query.page - 1) * query.pageSize,
        limit: query.pageSize,
        with: {
          category: { columns: { name: true } },
          variants: { columns: { price: true, stockQuantity: true } },
          images: {
            orderBy: (image, { asc }) => asc(image.position),
            limit: 1,
            columns: { url: true },
          },
        },
      }),
    ]);
    const total = totalRow!.n;

    return {
      total,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        categoryName: row.category.name,
        variantCount: row.variants.length,
        totalStock: row.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
        minPrice: row.variants.length
          ? row.variants
              .reduce(
                (min, v) => (v.price.lt(min) ? v.price : min),
                row.variants[0]!.price,
              )
              .toFixed(2)
          : null,
        imageUrl: row.images[0]?.url ?? null,
        updatedAt: row.updatedAt,
      })),
    };
  }

  async findForEdit(id: string): Promise<EditableProduct | null> {
    const row = await this.db().query.product.findFirst({
      where: eq(product.id, id),
      with: {
        options: {
          orderBy: (option, { asc }) => asc(option.position),
          with: {
            values: { orderBy: (value, { asc }) => asc(value.position) },
          },
        },
        variants: {
          orderBy: (variant, { asc }) => asc(variant.createdAt),
          with: {
            optionValues: { with: { optionValue: { with: { option: true } } } },
          },
        },
        images: {
          orderBy: (image, { asc }) => asc(image.position),
          with: { optionValue: { with: { option: true } } },
        },
        attributes: { columns: { attributeValueId: true } },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      categoryId: row.categoryId,
      brandId: row.brandId,
      taxRate: row.taxRate.toFixed(2),
      trackInventory: row.trackInventory,
      isFeatured: row.isFeatured,
      desi: row.desi?.toString() ?? null,
      weightGram: row.weightGram,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      ingredients: row.ingredients,
      allergens: row.allergens,
      shelfLife: row.shelfLife,
      attributeValueIds: row.attributes.map((a) => a.attributeValueId),
      options: row.options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => value.value),
      })),
      variants: row.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price.toFixed(2),
        compareAtPrice: variant.compareAtPrice?.toFixed(2) ?? null,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
        isActive: variant.isActive,
        optionValues: Object.fromEntries(
          variant.optionValues.map((link) => [
            link.optionValue.option.name,
            link.optionValue.value,
          ]),
        ),
      })),
      images: row.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        forOption: image.optionValue
          ? {
              option: image.optionValue.option.name,
              value: image.optionValue.value,
            }
          : null,
      })),
    };
  }

  async references(): Promise<FormReferences> {
    const db = this.db();
    const [categories, brands, attributes] = await Promise.all([
      db
        .select()
        .from(category)
        .orderBy(asc(category.sortOrder), asc(category.name)),
      db.select().from(brand).orderBy(asc(brand.name)),
      db.query.attribute.findMany({
        orderBy: asc(attribute.position),
        with: { values: { orderBy: (value, { asc }) => asc(value.position) } },
      }),
    ]);

    const byId = new Map(categories.map((c) => [c.id, c]));
    const labelFor = (id: string): string => {
      const parts: string[] = [];
      let current = byId.get(id);
      const seen = new Set<string>();
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        parts.unshift(current.name);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
      return parts.join(" › ");
    };

    return {
      categories: categories
        .map((c) => ({ id: c.id, label: labelFor(c.id) }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr")),
      brands: brands.map((b) => ({ id: b.id, name: b.name })),
      attributes: attributes.map((a) => ({
        id: a.id,
        name: a.name,
        values: a.values.map((v) => ({ id: v.id, value: v.value })),
      })),
    };
  }

  async slugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const [found] = await this.db()
      .select({ id: product.id })
      .from(product)
      .where(
        and(
          eq(product.slug, slug),
          excludeId ? ne(product.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return found !== undefined;
  }

  async create(input: ProductInput, slug: string): Promise<string> {
    const db = this.db();
    const id = newId();
    // Ürün, öznitelikler, seçenekler, varyantlar ve görseller tek batch'te (atomik): yarım ürün kalmaz.
    await runBatch(db, [
      db.insert(product).values({ id, ...this.productFields(input, slug) }),
      ...this.attributeOps(db, id, input),
      ...this.syncOps(db, id, input, []),
    ]);
    return id;
  }

  async update(id: string, input: ProductInput, slug: string): Promise<void> {
    const db = this.db();
    const existingOptions = await db.query.productOption.findMany({
      where: eq(productOption.productId, id),
      with: { values: true },
    });

    await runBatch(db, [
      db
        .update(product)
        .set(this.productFields(input, slug))
        .where(eq(product.id, id)),
      db
        .delete(productAttributeValue)
        .where(eq(productAttributeValue.productId, id)),
      ...this.attributeOps(db, id, input),
      ...this.syncOps(db, id, input, existingOptions),
    ]);
  }

  async addRedirect(fromPath: string, toPath: string): Promise<void> {
    if (fromPath === toPath) return;
    await this.db()
      .insert(redirect)
      .values({ fromPath, toPath })
      .onConflictDoUpdate({ target: redirect.fromPath, set: { toPath } });
  }

  private productFields(input: ProductInput, slug: string) {
    return {
      name: input.name,
      slug,
      description: input.description,
      status: input.status,
      categoryId: input.categoryId,
      brandId: input.brandId,
      taxRate: dec(input.taxRate),
      trackInventory: input.trackInventory,
      isFeatured: input.isFeatured,
      desi: dec(input.desi),
      weightGram:
        input.weightGram === null ? null : Math.round(input.weightGram),
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ingredients: input.ingredients,
      allergens: input.allergens,
      shelfLife: input.shelfLife,
    };
  }

  /** Öznitelik değerleri: satır başına ekleme (D1 sorgu başına 100 parametre sınırı). */
  private attributeOps(
    db: Db,
    productId: string,
    input: ProductInput,
  ): BatchOps {
    return input.attributeValueIds.map((attributeValueId) =>
      db.insert(productAttributeValue).values({ productId, attributeValueId }),
    );
  }

  /**
   * Seçenekleri ekler (silmez), varyantları günceller/oluşturur, listede
   * olmayan varyantları pasifleştirir (sipariş geçmişi korunur) ve görselleri
   * baştan yazar. Kimlikler uygulamada üretildiği için tüm yazma işlemleri tek batch'tedir.
   */
  private syncOps(
    db: Db,
    productId: string,
    input: ProductInput,
    existingOptions: {
      id: string;
      name: string;
      values: { id: string; value: string }[];
    }[],
  ): BatchOps {
    const ops: BatchOps = [];
    const valueIds = new Map<string, string>(); // "Seçenek\u0000Değer" → id

    // Seçenek ve değerler: mevcut olanı koru, eksik olanı ekle.
    for (const [position, option] of input.options.entries()) {
      const existing = existingOptions.find((o) => o.name === option.name);
      const optionId = existing?.id ?? newId();
      if (!existing) {
        ops.push(
          db
            .insert(productOption)
            .values({ id: optionId, productId, name: option.name, position }),
        );
      }

      const known = new Map(
        (existing?.values ?? []).map((v) => [v.value, v.id]),
      );
      for (const [valuePosition, value] of option.values.entries()) {
        let valueId = known.get(value);
        if (!valueId) {
          valueId = newId();
          ops.push(
            db.insert(productOptionValue).values({
              id: valueId,
              optionId,
              value,
              position: valuePosition,
            }),
          );
        }
        valueIds.set(`${option.name}\u0000${value}`, valueId);
      }
    }

    const keep: string[] = [];
    for (const variant of input.variants) {
      const data = {
        sku: variant.sku,
        barcode: variant.barcode,
        price: dec(variant.price),
        compareAtPrice: dec(variant.compareAtPrice),
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
      };

      if (variant.id) {
        ops.push(
          db
            .update(productVariant)
            .set(data)
            .where(eq(productVariant.id, variant.id)),
        );
        keep.push(variant.id);
        continue;
      }

      const variantId = newId();
      ops.push(
        db.insert(productVariant).values({ ...data, id: variantId, productId }),
        ...input.options.map((option) =>
          db.insert(variantOptionValue).values({
            variantId,
            optionValueId: valueIds.get(
              `${option.name}\u0000${variant.optionValues[option.name]}`,
            )!,
          }),
        ),
      );
      keep.push(variantId);
    }

    ops.push(
      db
        .update(productVariant)
        .set({ isActive: false })
        .where(
          and(
            eq(productVariant.productId, productId),
            keep.length ? notInArray(productVariant.id, keep) : undefined,
          ),
        ),
      db.delete(productImage).where(eq(productImage.productId, productId)),
      ...input.images.map((image, position) =>
        db.insert(productImage).values({
          productId,
          url: image.url,
          alt: image.alt,
          position,
          optionValueId: image.forOption
            ? (valueIds.get(
                `${image.forOption.option}\u0000${image.forOption.value}`,
              ) ?? null)
            : null,
        }),
      ),
    );
    return ops;
  }
}
