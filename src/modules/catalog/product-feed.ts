import Decimal from "decimal.js";
import { isInStock } from "./availability";

/**
 * Google Merchant Center ve Meta (Facebook/Instagram) Katalog için ürün
 * beslemesi. İki platform da Google'ın RSS 2.0 + `g:` ad alanı biçimini kabul
 * eder; her varyant ayrı bir ürün satırıdır, `item_group_id` ile gruplanır.
 */

export interface FeedVariant {
  id: string;
  sku: string;
  price: Decimal;
  compareAtPrice: Decimal | null;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  /** Geçerli GTIN ya da null */
  gtin: string | null;
  /** Seçenek değerleri (ör. "1 kg") */
  optionLabel: string | null;
  /** Varyanta özel görsel (mutlak URL) */
  imageUrl: string | null;
}

export interface FeedProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brandName: string | null;
  /** Site içi kategori yolu (ör. "Turşular > Klasik Turşular") */
  productType: string | null;
  trackInventory: boolean;
  weightGram: number | null;
  /** Mutlak görsel URL'leri, ilk görsel ana görseldir */
  imageUrls: string[];
  variants: FeedVariant[];
}

export interface FeedOptions {
  siteName: string;
  siteUrl: string;
  /** Marka tanımlı değilse kullanılan marka (genelde mağaza adı) */
  defaultBrand: string;
  shipping: { freeShippingThreshold: number; flatRate: number };
  /** Ürün URL'si üretir */
  productUrl: (slug: string) => string;
  /**
   * Google Product Taxonomy ID veya yol metni.
   * Örn. `422` veya `Food, Beverages & Tobacco > Food Items > Condiments & Sauces`
   */
  googleProductCategory?: string;
}

const DESCRIPTION_MAX = 5000;
const TITLE_MAX = 150;

export function escapeXml(value: string): string {
  return (
    value
      // XML 1.0'da geçersiz kontrol karakterleri beslemeyi bozar.
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  );
}

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function money(value: Decimal, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

function tag(name: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `<g:${name}>${escapeXml(value)}</g:${name}>`;
}

function variantItem(
  product: FeedProduct,
  variant: FeedVariant,
  options: FeedOptions,
): string {
  const inStock = isInStock({
    trackInventory: product.trackInventory,
    stockQuantity: variant.stockQuantity,
    reservedQuantity: variant.reservedQuantity,
  });
  const onSale = variant.compareAtPrice?.gt(variant.price) ?? false;
  const title = variant.optionLabel
    ? `${product.name} - ${variant.optionLabel}`
    : product.name;
  const images = variant.imageUrl
    ? [
        variant.imageUrl,
        ...product.imageUrls.filter((u) => u !== variant.imageUrl),
      ]
    : product.imageUrls;
  const shippingPrice = variant.price.gte(
    options.shipping.freeShippingThreshold,
  )
    ? new Decimal(0)
    : new Decimal(options.shipping.flatRate);

  return [
    "<item>",
    tag("id", variant.sku || variant.id),
    product.variants.length > 1 ? tag("item_group_id", product.id) : "",
    tag("title", clip(title, TITLE_MAX)),
    tag(
      "description",
      clip(product.description || product.name, DESCRIPTION_MAX),
    ),
    tag("link", options.productUrl(product.slug)),
    tag("image_link", images[0]),
    ...images.slice(1, 11).map((url) => tag("additional_image_link", url)),
    tag("availability", inStock ? "in_stock" : "out_of_stock"),
    tag("condition", "new"),
    tag(
      "price",
      money(onSale ? variant.compareAtPrice! : variant.price, variant.currency),
    ),
    onSale ? tag("sale_price", money(variant.price, variant.currency)) : "",
    tag("brand", product.brandName || options.defaultBrand),
    variant.gtin ? tag("gtin", variant.gtin) : tag("identifier_exists", "no"),
    tag("product_type", product.productType),
    tag("google_product_category", options.googleProductCategory),
    variant.optionLabel ? tag("size", variant.optionLabel) : "",
    product.weightGram ? tag("shipping_weight", `${product.weightGram} g`) : "",
    `<g:shipping>${tag("country", "TR")}${tag("price", money(shippingPrice, variant.currency))}</g:shipping>`,
    "</item>",
  ].join("");
}

/** Ürün listesinden RSS 2.0 (Google Merchant / Meta Katalog) XML'i üretir. */
export function buildProductFeedXml(
  products: readonly FeedProduct[],
  options: FeedOptions,
): string {
  const items = products
    .filter(
      (product) =>
        product.imageUrls.length > 0 ||
        product.variants.some((v) => v.imageUrl),
    )
    .flatMap((product) =>
      product.variants.map((variant) => variantItem(product, variant, options)),
    );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    `<title>${escapeXml(options.siteName)}</title>`,
    `<link>${escapeXml(options.siteUrl)}</link>`,
    `<description>${escapeXml(`${options.siteName} ürün kataloğu`)}</description>`,
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}
