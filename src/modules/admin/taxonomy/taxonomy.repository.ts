import { and, asc, eq, ne, sql } from "drizzle-orm";
import {
  attribute,
  attributeValue,
  brand,
  category,
  countWhere,
  newId,
  product,
  productAttributeValue,
  redirect,
  type Db,
} from "@/db";
import type {
  AttributeInput,
  BrandInput,
  CategoryInput,
} from "./taxonomy.schema";

export interface CategoryRecord {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
}

export interface BrandRecord {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

export interface AttributeRecord {
  id: string;
  name: string;
  slug: string;
  type: "SELECT" | "MULTI_SELECT";
  isFilterable: boolean;
  position: number;
  values: { id: string; value: string; slug: string; productCount: number }[];
}

export interface TaxonomyRepository {
  listCategories(): Promise<CategoryRecord[]>;
  findCategory(id: string): Promise<CategoryRecord | null>;
  categorySlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  createCategory(input: CategoryInput, slug: string): Promise<string>;
  updateCategory(id: string, input: CategoryInput, slug: string): Promise<void>;
  countCategoryChildren(id: string): Promise<number>;
  countCategoryProducts(id: string): Promise<number>;
  deleteCategory(id: string): Promise<void>;
  addRedirect(fromPath: string, toPath: string): Promise<void>;

  listBrands(): Promise<BrandRecord[]>;
  brandSlugTaken(slug: string): Promise<boolean>;
  createBrand(input: BrandInput, slug: string): Promise<string>;
  deleteBrand(id: string): Promise<void>;

  listAttributes(): Promise<AttributeRecord[]>;
  attributeSlugTaken(slug: string): Promise<boolean>;
  createAttribute(input: AttributeInput, slug: string): Promise<string>;
  updateAttribute(id: string, input: AttributeInput): Promise<void>;
  deleteAttribute(id: string): Promise<void>;
  addAttributeValue(
    attributeId: string,
    value: string,
    slug: string,
  ): Promise<void>;
  attributeValueSlugTaken(attributeId: string, slug: string): Promise<boolean>;
  countAttributeValueProducts(valueId: string): Promise<number>;
  deleteAttributeValue(valueId: string): Promise<void>;
}

export class D1TaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: () => Db) {}

  private categoryColumns() {
    return {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      productCount: sql<number>`(SELECT count(*) FROM "Product" WHERE "Product"."categoryId" = ${category.id})`,
    };
  }

  listCategories(): Promise<CategoryRecord[]> {
    return this.db()
      .select(this.categoryColumns())
      .from(category)
      .orderBy(asc(category.sortOrder), asc(category.name));
  }

  async findCategory(id: string): Promise<CategoryRecord | null> {
    const [row] = await this.db()
      .select(this.categoryColumns())
      .from(category)
      .where(eq(category.id, id))
      .limit(1);
    return row ?? null;
  }

  async categorySlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    return (
      (await countWhere(
        this.db(),
        category,
        and(
          eq(category.slug, slug),
          excludeId ? ne(category.id, excludeId) : undefined,
        ),
      )) > 0
    );
  }

  async createCategory(input: CategoryInput, slug: string): Promise<string> {
    const [created] = await this.db()
      .insert(category)
      .values({ ...input, slug })
      .returning({ id: category.id });
    return created!.id;
  }

  async updateCategory(
    id: string,
    input: CategoryInput,
    slug: string,
  ): Promise<void> {
    await this.db()
      .update(category)
      .set({ ...input, slug })
      .where(eq(category.id, id));
  }

  countCategoryChildren(id: string): Promise<number> {
    return countWhere(this.db(), category, eq(category.parentId, id));
  }

  countCategoryProducts(id: string): Promise<number> {
    return countWhere(this.db(), product, eq(product.categoryId, id));
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db().delete(category).where(eq(category.id, id));
  }

  async addRedirect(fromPath: string, toPath: string): Promise<void> {
    if (fromPath === toPath) return;
    await this.db()
      .insert(redirect)
      .values({ fromPath, toPath })
      .onConflictDoUpdate({ target: redirect.fromPath, set: { toPath } });
  }

  async listBrands(): Promise<BrandRecord[]> {
    return this.db()
      .select({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        productCount: sql<number>`(SELECT count(*) FROM "Product" WHERE "Product"."brandId" = ${brand.id})`,
      })
      .from(brand)
      .orderBy(asc(brand.name));
  }

  async brandSlugTaken(slug: string): Promise<boolean> {
    return (await countWhere(this.db(), brand, eq(brand.slug, slug))) > 0;
  }

  async createBrand(input: BrandInput, slug: string): Promise<string> {
    const [created] = await this.db()
      .insert(brand)
      .values({ name: input.name, logoUrl: input.logoUrl, slug })
      .returning({ id: brand.id });
    return created!.id;
  }

  async deleteBrand(id: string): Promise<void> {
    await this.db().delete(brand).where(eq(brand.id, id));
  }

  async listAttributes(): Promise<AttributeRecord[]> {
    const db = this.db();
    const rows = await db.query.attribute.findMany({
      orderBy: [asc(attribute.position), asc(attribute.name)],
      with: {
        values: {
          orderBy: [asc(attributeValue.position), asc(attributeValue.value)],
        },
      },
    });

    // Değer başına ürün sayısı tek gruplu sorguyla alınır.
    const counts = await db
      .select({
        id: productAttributeValue.attributeValueId,
        n: sql<number>`count(*)`,
      })
      .from(productAttributeValue)
      .groupBy(productAttributeValue.attributeValueId);
    const productCounts = new Map(counts.map((row) => [row.id, Number(row.n)]));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      isFilterable: row.isFilterable,
      position: row.position,
      values: row.values.map((value) => ({
        id: value.id,
        value: value.value,
        slug: value.slug,
        productCount: productCounts.get(value.id) ?? 0,
      })),
    }));
  }

  async attributeSlugTaken(slug: string): Promise<boolean> {
    return (
      (await countWhere(this.db(), attribute, eq(attribute.slug, slug))) > 0
    );
  }

  async createAttribute(input: AttributeInput, slug: string): Promise<string> {
    const [created] = await this.db()
      .insert(attribute)
      .values({ ...input, slug })
      .returning({ id: attribute.id });
    return created!.id;
  }

  async updateAttribute(id: string, input: AttributeInput): Promise<void> {
    await this.db().update(attribute).set(input).where(eq(attribute.id, id));
  }

  async deleteAttribute(id: string): Promise<void> {
    await this.db().delete(attribute).where(eq(attribute.id, id));
  }

  async addAttributeValue(
    attributeId: string,
    value: string,
    slug: string,
  ): Promise<void> {
    const db = this.db();
    const position = await countWhere(
      db,
      attributeValue,
      eq(attributeValue.attributeId, attributeId),
    );
    await db
      .insert(attributeValue)
      .values({ id: newId(), attributeId, value, slug, position });
  }

  async attributeValueSlugTaken(
    attributeId: string,
    slug: string,
  ): Promise<boolean> {
    return (
      (await countWhere(
        this.db(),
        attributeValue,
        and(
          eq(attributeValue.attributeId, attributeId),
          eq(attributeValue.slug, slug),
        ),
      )) > 0
    );
  }

  countAttributeValueProducts(valueId: string): Promise<number> {
    return countWhere(
      this.db(),
      productAttributeValue,
      eq(productAttributeValue.attributeValueId, valueId),
    );
  }

  async deleteAttributeValue(valueId: string): Promise<void> {
    await this.db()
      .delete(attributeValue)
      .where(eq(attributeValue.id, valueId));
  }
}
