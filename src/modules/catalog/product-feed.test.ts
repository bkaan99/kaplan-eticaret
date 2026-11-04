import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  buildProductFeedXml,
  escapeXml,
  type FeedOptions,
  type FeedProduct,
  type FeedVariant,
} from "./product-feed";

const options: FeedOptions = {
  siteName: "Kaplan Turşu",
  siteUrl: "https://site.test",
  defaultBrand: "Kaplan",
  shipping: { freeShippingThreshold: 500, flatRate: 49.9 },
  productUrl: (slug) => `https://site.test/urun/${slug}`,
};

const variant = (overrides: Partial<FeedVariant> = {}): FeedVariant => ({
  id: "v1",
  sku: "TRS-1KG",
  price: new Decimal("249.90"),
  compareAtPrice: null,
  currency: "TRY",
  stockQuantity: 10,
  reservedQuantity: 0,
  gtin: null,
  optionLabel: null,
  imageUrl: null,
  ...overrides,
});

const product = (overrides: Partial<FeedProduct> = {}): FeedProduct => ({
  id: "p1",
  slug: "salatalik-tursusu",
  name: "Salatalık Turşusu",
  description: "Doğal fermente",
  brandName: null,
  productType: "Turşular > Klasik",
  trackInventory: true,
  weightGram: 1000,
  imageUrls: ["https://site.test/a.jpg"],
  variants: [variant()],
  ...overrides,
});

describe("buildProductFeedXml", () => {
  it("tek varyantlı ürünü Google formatında yazar", () => {
    const xml = buildProductFeedXml([product()], options);
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(xml).toContain("<g:id>TRS-1KG</g:id>");
    expect(xml).toContain("<g:price>249.90 TRY</g:price>");
    expect(xml).toContain("<g:availability>in_stock</g:availability>");
    expect(xml).toContain("<g:brand>Kaplan</g:brand>");
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(xml).toContain(
      "<g:shipping><g:country>TR</g:country><g:price>49.90 TRY</g:price></g:shipping>",
    );
    expect(xml).not.toContain("item_group_id");
  });

  it("indirimde eski fiyatı price, yeni fiyatı sale_price yazar", () => {
    const xml = buildProductFeedXml(
      [
        product({
          variants: [variant({ compareAtPrice: new Decimal("299.90") })],
        }),
      ],
      options,
    );
    expect(xml).toContain("<g:price>299.90 TRY</g:price>");
    expect(xml).toContain("<g:sale_price>249.90 TRY</g:sale_price>");
  });

  it("çok varyantlı üründe her varyantı item_group_id ile gruplar", () => {
    const xml = buildProductFeedXml(
      [
        product({
          variants: [
            variant({ sku: "A", optionLabel: "1 kg" }),
            variant({
              id: "v2",
              sku: "B",
              optionLabel: "3 kg",
              gtin: "8690504000013",
            }),
          ],
        }),
      ],
      options,
    );
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml).toContain("<g:item_group_id>p1</g:item_group_id>");
    expect(xml).toContain("<g:title>Salatalık Turşusu - 3 kg</g:title>");
    expect(xml).toContain("<g:gtin>8690504000013</g:gtin>");
  });

  it("stok bitmişse out_of_stock, ücretsiz kargo limitinde 0 kargo yazar", () => {
    const xml = buildProductFeedXml(
      [
        product({
          variants: [
            variant({
              price: new Decimal(600),
              stockQuantity: 2,
              reservedQuantity: 2,
            }),
          ],
        }),
      ],
      options,
    );
    expect(xml).toContain("<g:availability>out_of_stock</g:availability>");
    expect(xml).toContain("<g:price>0.00 TRY</g:price></g:shipping>");
  });

  it("görseli olmayan ürünü atlar (Google görselsiz ürünü reddeder)", () => {
    const xml = buildProductFeedXml([product({ imageUrls: [] })], options);
    expect(xml).not.toContain("<item>");
  });

  it("özel karakterleri kaçırır", () => {
    expect(escapeXml(`Biber & "Acı" <1kg>`)).toBe(
      "Biber &amp; &quot;Acı&quot; &lt;1kg&gt;",
    );
  });
});
