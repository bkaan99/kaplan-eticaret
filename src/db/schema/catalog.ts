import Decimal from "decimal.js";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { decimal, newId, timestamp } from "../types";

export const category = sqliteTable(
  "Category",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    parentId: text("parentId"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    sortOrder: integer("sortOrder").notNull().default(0),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Category_parentId_idx").on(t.parentId)],
);

export const brand = sqliteTable("Brand", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const product = sqliteTable(
  "Product",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    status: text("status", { enum: ["DRAFT", "ACTIVE", "ARCHIVED"] })
      .notNull()
      .default("DRAFT"),
    categoryId: text("categoryId").notNull(),
    brandId: text("brandId"),
    taxRate: decimal("taxRate").notNull().default(new Decimal(1)),
    trackInventory: integer("trackInventory", { mode: "boolean" })
      .notNull()
      .default(true),
    desi: decimal("desi"),
    weightGram: integer("weightGram"),
    /** İçindekiler listesi (serbest metin) */
    ingredients: text("ingredients"),
    /** Alerjen uyarısı (ör. "Hardal içerir") */
    allergens: text("allergens"),
    /** Raf ömrü / tüketim süresi (ör. "Açılmadan 12 ay") */
    shelfLife: text("shelfLife"),
    isFeatured: integer("isFeatured", { mode: "boolean" })
      .notNull()
      .default(false),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("Product_categoryId_idx").on(t.categoryId),
    index("Product_brandId_idx").on(t.brandId),
    index("Product_status_idx").on(t.status),
  ],
);

export const productOption = sqliteTable(
  "ProductOption",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [unique("ProductOption_productId_name_key").on(t.productId, t.name)],
);

export const productOptionValue = sqliteTable(
  "ProductOptionValue",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    optionId: text("optionId").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("ProductOptionValue_optionId_value_key").on(t.optionId, t.value),
  ],
);

export const productVariant = sqliteTable(
  "ProductVariant",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    sku: text("sku").notNull().unique(),
    barcode: text("barcode"),
    price: decimal("price").notNull(),
    compareAtPrice: decimal("compareAtPrice"),
    currency: text("currency").notNull().default("TRY"),
    stockQuantity: integer("stockQuantity").notNull().default(0),
    reservedQuantity: integer("reservedQuantity").notNull().default(0),
    desi: decimal("desi"),
    weightGram: integer("weightGram"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("ProductVariant_productId_idx").on(t.productId)],
);

export const variantOptionValue = sqliteTable(
  "VariantOptionValue",
  {
    variantId: text("variantId").notNull(),
    optionValueId: text("optionValueId").notNull(),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.optionValueId] })],
);

export const productImage = sqliteTable(
  "ProductImage",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    optionValueId: text("optionValueId"),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("ProductImage_productId_position_idx").on(t.productId, t.position),
  ],
);

export const attribute = sqliteTable("Attribute", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type", { enum: ["SELECT", "MULTI_SELECT"] })
    .notNull()
    .default("SELECT"),
  isFilterable: integer("isFilterable", { mode: "boolean" })
    .notNull()
    .default(true),
  position: integer("position").notNull().default(0),
});

export const attributeValue = sqliteTable(
  "AttributeValue",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    attributeId: text("attributeId").notNull(),
    value: text("value").notNull(),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("AttributeValue_attributeId_slug_key").on(t.attributeId, t.slug),
  ],
);

export const productAttributeValue = sqliteTable(
  "ProductAttributeValue",
  {
    productId: text("productId").notNull(),
    attributeValueId: text("attributeValueId").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.attributeValueId] }),
    index("ProductAttributeValue_attributeValueId_idx").on(t.attributeValueId),
  ],
);

export const relatedProduct = sqliteTable(
  "RelatedProduct",
  {
    productId: text("productId").notNull(),
    relatedProductId: text("relatedProductId").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.relatedProductId] })],
);

export const redirect = sqliteTable("Redirect", {
  id: text("id").primaryKey().$defaultFn(newId),
  fromPath: text("fromPath").notNull().unique(),
  toPath: text("toPath").notNull(),
  statusCode: integer("statusCode").notNull().default(301),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const variantGroupPrice = sqliteTable(
  "VariantGroupPrice",
  {
    variantId: text("variantId").notNull(),
    groupId: text("groupId").notNull(),
    price: decimal("price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.groupId] })],
);

export const tierPrice = sqliteTable(
  "TierPrice",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    variantId: text("variantId").notNull(),
    groupId: text("groupId"),
    minQuantity: integer("minQuantity").notNull(),
    price: decimal("price").notNull(),
  },
  (t) => [
    unique("TierPrice_variantId_groupId_minQuantity_key").on(
      t.variantId,
      t.groupId,
      t.minQuantity,
    ),
  ],
);
