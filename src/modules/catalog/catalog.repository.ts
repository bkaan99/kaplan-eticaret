import type Decimal from "decimal.js";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  or,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  attribute,
  attributeValue,
  brand,
  category,
  containsText,
  product,
  productAttributeValue,
  productImage,
  productVariant,
  redirect,
  relatedProduct,
  type Db,
} from "@/db";
import type { BadgeAttribute } from "./product-badges";
import type { CategoryNode, SortOption } from "./catalog.types";

export interface ProductFilter {
  categoryIds?: string[];
  search?: string;
  brandSlugs: string[];
  attributeFilters: Record<string, string[]>;
}

/** PLP: filtre + sıralama + sayfa; SQL tarafında limit/offset. */
export interface ListingQuery extends ProductFilter {
  sort: SortOption;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
}

export interface ListingPage {
  ids: string[];
  total: number;
  page: number;
}

export interface ListingRow {
  id: string;
  name: string;
  createdAt: Date;
  minPrice: Decimal;
}

export interface VariantRecord {
  id: string;
  sku: string;
  price: Decimal;
  compareAtPrice: Decimal | null;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  optionValueIds: string[];
}

export interface ProductCardRecord {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  trackInventory: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  variants: VariantRecord[];
  /** Kart rozetleri için nitelik değerleri */
  attributes: BadgeAttribute[];
}

export interface AttributeFacetRecord {
  attributeSlug: string;
  attributeName: string;
  attributePosition: number;
  valueSlug: string;
  value: string;
  valuePosition: number;
  count: number;
}

export interface BrandCountRecord {
  slug: string;
  name: string;
  count: number;
}

export interface ProductDetailRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  trackInventory: boolean;
  taxRate: Decimal;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  brand: { name: string; slug: string } | null;
  images: {
    url: string;
    alt: string | null;
    optionValueId: string | null;
  }[];
  options: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
  variants: VariantRecord[];
  attributes: { name: string; value: string }[];
  ingredients: string | null;
  allergens: string | null;
  shelfLife: string | null;
  /** İlk aktif varyantın barkodu (GTIN) */
  barcode: string | null;
  weightGram: number | null;
}

export interface CatalogRepository {
  listCategories(): Promise<CategoryNode[]>;
  searchListingPage(query: ListingQuery): Promise<ListingPage>;
  findCards(ids: string[]): Promise<ProductCardRecord[]>;
  countAttributeFacets(
    filter: Omit<ProductFilter, "attributeFilters">,
  ): Promise<AttributeFacetRecord[]>;
  countBrands(
    filter: Omit<ProductFilter, "attributeFilters" | "brandSlugs">,
  ): Promise<BrandCountRecord[]>;
  findDetailBySlug(slug: string): Promise<ProductDetailRecord | null>;
  findManualRelatedIds(productId: string, limit: number): Promise<string[]>;
  findSimilarIds(
    productId: string,
    categoryId: string,
    limit: number,
  ): Promise<string[]>;
  findRedirect(path: string): Promise<{ toPath: string } | null>;
  /** Öne çıkan ürünler; yetersizse en yeniler tamamlar. */
  findFeaturedIds(limit: number): Promise<string[]>;
  /** Sitemap için yayındaki tüm ürün slug'ları. */
  listActiveProductSlugs(): Promise<
    { slug: string; updatedAt: Date; imageUrl: string | null }[]
  >;
}

/** Listeleme koşulu; `product` tablosuna bağlı ilişkili alt sorgular (exists) kullanır. */
function buildWhere(
  db: Db,
  filter: Partial<ProductFilter>,
  options: { requireActiveVariant?: boolean } = {},
): SQL {
  const conditions: (SQL | undefined)[] = [
    eq(product.status, "ACTIVE"),
    options.requireActiveVariant === false ? undefined : hasActiveVariant(db),
    filter.categoryIds
      ? inArray(product.categoryId, filter.categoryIds)
      : undefined,
  ];

  if (filter.brandSlugs?.length) {
    conditions.push(
      exists(
        db
          .select({ one: brand.id })
          .from(brand)
          .where(
            and(
              eq(brand.id, product.brandId),
              inArray(brand.slug, filter.brandSlugs),
            ),
          ),
      ),
    );
  }

  if (filter.search) {
    const term = filter.search;
    conditions.push(
      or(
        containsText(product.name, term),
        containsText(product.description, term),
        exists(
          db
            .select({ one: brand.id })
            .from(brand)
            .where(
              and(
                eq(brand.id, product.brandId),
                containsText(brand.name, term),
              ),
            ),
        ),
        exists(
          db
            .select({ one: productVariant.id })
            .from(productVariant)
            .where(
              and(
                eq(productVariant.productId, product.id),
                containsText(productVariant.sku, term),
              ),
            ),
        ),
      ),
    );
  }

  for (const [attributeSlug, valueSlugs] of Object.entries(
    filter.attributeFilters ?? {},
  )) {
    conditions.push(
      exists(
        db
          .select({ one: productAttributeValue.productId })
          .from(productAttributeValue)
          .innerJoin(
            attributeValue,
            eq(attributeValue.id, productAttributeValue.attributeValueId),
          )
          .innerJoin(attribute, eq(attribute.id, attributeValue.attributeId))
          .where(
            and(
              eq(productAttributeValue.productId, product.id),
              inArray(attributeValue.slug, valueSlugs),
              eq(attribute.slug, attributeSlug),
            ),
          ),
      ),
    );
  }

  return and(...conditions)!;
}

function needsPriceFilter(query: ListingQuery): boolean {
  return query.minPrice !== undefined || query.maxPrice !== undefined;
}

function needsPriceJoin(query: ListingQuery): boolean {
  return (
    query.sort === "price-asc" ||
    query.sort === "price-desc" ||
    needsPriceFilter(query)
  );
}

function activeVariantJoin(): SQL {
  return and(
    eq(productVariant.productId, product.id),
    eq(productVariant.isActive, true),
  )!;
}

function priceHaving(query: ListingQuery): SQL | undefined {
  const parts: SQL[] = [];
  if (query.minPrice !== undefined) {
    parts.push(sql`min(${productVariant.price}) >= ${query.minPrice}`);
  }
  if (query.maxPrice !== undefined) {
    parts.push(sql`min(${productVariant.price}) <= ${query.maxPrice}`);
  }
  return parts.length > 0 ? and(...parts) : undefined;
}

function listingOrderBy(sort: SortOption, withPrice: boolean): SQL {
  switch (sort) {
    case "price-asc":
      return withPrice
        ? sql`min(${productVariant.price}) asc`
        : desc(product.createdAt);
    case "price-desc":
      return withPrice
        ? sql`min(${productVariant.price}) desc`
        : desc(product.createdAt);
    case "name":
      return sql`${product.name} collate nocase asc`;
    case "newest":
    default:
      return desc(product.createdAt);
  }
}

/** Aktif varyantlar fiyata göre artan sırada, seçenek değer kimlikleriyle. */
const activeVariants = {
  where: eq(productVariant.isActive, true),
  orderBy: asc(productVariant.price),
  with: { optionValues: { columns: { optionValueId: true } } },
} as const;

type VariantRow = {
  id: string;
  sku: string;
  price: Decimal;
  compareAtPrice: Decimal | null;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  optionValues: { optionValueId: string }[];
};

function toVariantRecord(row: VariantRow): VariantRecord {
  return {
    id: row.id,
    sku: row.sku,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    currency: row.currency,
    stockQuantity: row.stockQuantity,
    reservedQuantity: row.reservedQuantity,
    optionValueIds: row.optionValues.map((item) => item.optionValueId),
  };
}

export class D1CatalogRepository implements CatalogRepository {
  /** İstemci tembel verilir; env doğrulaması yalnızca ilk sorguda çalışır. */
  constructor(private readonly db: () => Db) {}

  async listCategories(): Promise<CategoryNode[]> {
    const rows = await this.db()
      .select()
      .from(category)
      .where(eq(category.isActive, true))
      .orderBy(asc(category.sortOrder), asc(category.name));

    return rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      sortOrder: row.sortOrder,
    }));
  }

  async searchListingPage(query: ListingQuery): Promise<ListingPage> {
    if (query.page <= 1) {
      const [total, ids] = await Promise.all([
        this.countListingMatches(query),
        this.selectListingIds(query, query.pageSize, 0),
      ]);
      return total === 0
        ? { ids: [], total: 0, page: 1 }
        : { ids, total, page: 1 };
    }

    const total = await this.countListingMatches(query);
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    if (total === 0) return { ids: [], total: 0, page: 1 };

    const ids = await this.selectListingIds(
      query,
      query.pageSize,
      (page - 1) * query.pageSize,
    );
    return { ids, total, page };
  }

  private async countListingMatches(query: ListingQuery): Promise<number> {
    const db = this.db();

    if (!needsPriceFilter(query)) {
      const [row] = await db
        .select({ total: count() })
        .from(product)
        .where(buildWhere(db, query));
      return row?.total ?? 0;
    }

    // INNER JOIN ProductVariant (isActive=true) aktif varyant varlığını zaten doğrular.
    const filtered = db
      .select({ id: product.id })
      .from(product)
      .innerJoin(productVariant, activeVariantJoin())
      .where(buildWhere(db, query, { requireActiveVariant: false }))
      .groupBy(product.id)
      .having(priceHaving(query))
      .as("filtered_listing");

    const [row] = await db.select({ total: count() }).from(filtered);
    return row?.total ?? 0;
  }

  private async selectListingIds(
    query: ListingQuery,
    limit: number,
    offset: number,
  ): Promise<string[]> {
    const db = this.db();
    const withPrice = needsPriceJoin(query);
    const orderBy = listingOrderBy(query.sort, withPrice);

    if (!withPrice) {
      const rows = await db
        .select({ id: product.id })
        .from(product)
        .where(buildWhere(db, query))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
      return rows.map((row) => row.id);
    }

    const rows = await db
      .select({ id: product.id })
      .from(product)
      .innerJoin(productVariant, activeVariantJoin())
      .where(buildWhere(db, query, { requireActiveVariant: false }))
      .groupBy(product.id)
      .having(priceHaving(query))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    return rows.map((row) => row.id);
  }

  async findCards(ids: string[]): Promise<ProductCardRecord[]> {
    if (ids.length === 0) return [];

    const rows = await this.db().query.product.findMany({
      where: and(inArray(product.id, ids), eq(product.status, "ACTIVE")),
      columns: { id: true, slug: true, name: true, trackInventory: true },
      with: {
        brand: { columns: { name: true } },
        images: {
          orderBy: (image, { asc }) => asc(image.position),
          limit: 1,
          columns: { url: true, alt: true },
        },
        variants: activeVariants,
        attributes: {
          with: {
            attributeValue: {
              columns: { slug: true, value: true },
              with: { attribute: { columns: { slug: true } } },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brandName: row.brand?.name ?? null,
      trackInventory: row.trackInventory,
      imageUrl: row.images[0]?.url ?? null,
      imageAlt: row.images[0]?.alt ?? null,
      variants: row.variants.map(toVariantRecord),
      attributes: row.attributes.map((item) => ({
        attributeSlug: item.attributeValue.attribute.slug,
        valueSlug: item.attributeValue.slug,
        value: item.attributeValue.value,
      })),
    }));
  }

  async countAttributeFacets(
    filter: Omit<ProductFilter, "attributeFilters">,
  ): Promise<AttributeFacetRecord[]> {
    const db = this.db();
    const rows = await db
      .select({
        attributeSlug: attribute.slug,
        attributeName: attribute.name,
        attributePosition: attribute.position,
        valueSlug: attributeValue.slug,
        value: attributeValue.value,
        valuePosition: attributeValue.position,
        count: count(),
      })
      .from(product)
      .innerJoin(
        productAttributeValue,
        eq(productAttributeValue.productId, product.id),
      )
      .innerJoin(
        attributeValue,
        eq(attributeValue.id, productAttributeValue.attributeValueId),
      )
      .innerJoin(attribute, eq(attribute.id, attributeValue.attributeId))
      .where(
        and(
          buildWhere(db, { ...filter, attributeFilters: {} }),
          eq(attribute.isFilterable, true),
        ),
      )
      .groupBy(attributeValue.id);

    return rows;
  }

  async countBrands(
    filter: Omit<ProductFilter, "attributeFilters" | "brandSlugs">,
  ): Promise<BrandCountRecord[]> {
    const db = this.db();
    return db
      .select({ slug: brand.slug, name: brand.name, count: count() })
      .from(product)
      .innerJoin(brand, eq(brand.id, product.brandId))
      .where(
        buildWhere(db, { ...filter, brandSlugs: [], attributeFilters: {} }),
      )
      .groupBy(brand.id);
  }

  async findDetailBySlug(slug: string): Promise<ProductDetailRecord | null> {
    const row = await this.db().query.product.findFirst({
      where: and(eq(product.slug, slug), eq(product.status, "ACTIVE")),
      with: {
        brand: true,
        images: { orderBy: (image, { asc }) => asc(image.position) },
        options: {
          orderBy: (option, { asc }) => asc(option.position),
          with: {
            values: { orderBy: (value, { asc }) => asc(value.position) },
          },
        },
        variants: activeVariants,
        attributes: { with: { attributeValue: { with: { attribute: true } } } },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      trackInventory: row.trackInventory,
      taxRate: row.taxRate,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      categoryId: row.categoryId,
      brand: row.brand ? { name: row.brand.name, slug: row.brand.slug } : null,
      images: row.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        optionValueId: image.optionValueId,
      })),
      options: row.options.map((option) => ({
        id: option.id,
        name: option.name,
        values: option.values.map((value) => ({
          id: value.id,
          value: value.value,
        })),
      })),
      variants: row.variants.map(toVariantRecord),
      attributes: row.attributes.map((item) => ({
        name: item.attributeValue.attribute.name,
        value: item.attributeValue.value,
      })),
      ingredients: row.ingredients,
      allergens: row.allergens,
      shelfLife: row.shelfLife,
      barcode: row.variants.find((variant) => variant.barcode)?.barcode ?? null,
      weightGram: row.weightGram,
    };
  }

  async findManualRelatedIds(
    productId: string,
    limit: number,
  ): Promise<string[]> {
    const rows = await this.db()
      .select({ id: relatedProduct.relatedProductId })
      .from(relatedProduct)
      .innerJoin(product, eq(product.id, relatedProduct.relatedProductId))
      .where(
        and(
          eq(relatedProduct.productId, productId),
          eq(product.status, "ACTIVE"),
        ),
      )
      .orderBy(asc(relatedProduct.position))
      .limit(limit);
    return rows.map((row) => row.id);
  }

  async findSimilarIds(
    productId: string,
    categoryId: string,
    limit: number,
  ): Promise<string[]> {
    const db = this.db();
    const rows = await db
      .select({ id: product.id })
      .from(product)
      .where(
        and(
          ne(product.id, productId),
          eq(product.categoryId, categoryId),
          eq(product.status, "ACTIVE"),
          hasActiveVariant(db),
        ),
      )
      .orderBy(desc(product.createdAt))
      .limit(limit);
    return rows.map((row) => row.id);
  }

  async findRedirect(path: string): Promise<{ toPath: string } | null> {
    const [row] = await this.db()
      .select({ toPath: redirect.toPath })
      .from(redirect)
      .where(eq(redirect.fromPath, path))
      .limit(1);
    return row ?? null;
  }

  async findFeaturedIds(limit: number): Promise<string[]> {
    if (limit <= 0) return [];
    const db = this.db();
    const base = and(eq(product.status, "ACTIVE"), hasActiveVariant(db));
    const featured = await db
      .select({ id: product.id })
      .from(product)
      .where(and(base, eq(product.isFeatured, true)))
      .orderBy(desc(product.createdAt))
      .limit(limit);
    if (featured.length >= limit) return featured.map((row) => row.id);

    // featured.length < limit tüm aktif öne çıkanları kapsadığından, tamamlayıcılar isFeatured=false'tur.
    const filler = await db
      .select({ id: product.id })
      .from(product)
      .where(and(base, eq(product.isFeatured, false)))
      .orderBy(desc(product.createdAt))
      .limit(limit - featured.length);
    return [...featured, ...filler].map((row) => row.id);
  }

  async listActiveProductSlugs(): Promise<
    { slug: string; updatedAt: Date; imageUrl: string | null }[]
  > {
    const db = this.db();
    const rows = await db.query.product.findMany({
      where: and(eq(product.status, "ACTIVE"), hasActiveVariant(db)),
      columns: { slug: true, updatedAt: true },
      with: {
        images: {
          where: isNull(productImage.optionValueId),
          orderBy: (image, { asc: orderAsc }) => orderAsc(image.position),
          limit: 1,
          columns: { url: true },
        },
      },
    });
    return rows.map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt,
      imageUrl: row.images[0]?.url ?? null,
    }));
  }
}

function hasActiveVariant(db: Db): SQL {
  return exists(
    db
      .select({ one: productVariant.id })
      .from(productVariant)
      .where(
        and(
          eq(productVariant.productId, product.id),
          eq(productVariant.isActive, true),
        ),
      ),
  );
}
