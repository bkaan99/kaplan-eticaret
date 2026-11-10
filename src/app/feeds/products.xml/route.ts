import { connection } from "next/server";
import { siteConfig } from "@/config/site.config";
import { catalogService } from "@/modules/catalog/container";
import { buildProductFeedXml } from "@/modules/catalog/product-feed";
import { listFeedProducts } from "@/modules/catalog/product-feed.repository";
import { settingsService } from "@/modules/settings/container";
import { getDb } from "@/shared/db";
import { absoluteUrl, getSiteUrl } from "@/shared/site-url";

/**
 * Google Merchant Center ve Meta Katalog ürün beslemesi (RSS 2.0, `g:` alanları).
 * Merchant Center / Commerce Manager'a "zamanlanmış besleme" olarak
 * https://<alan-adı>/feeds/products.xml adresi verilir.
 */
export async function GET() {
  await connection();

  // Yalnızca-B2B modunda fiyatlar herkese açık değildir; besleme yayınlanmaz.
  if (siteConfig.salesMode === "b2b") {
    return new Response("Not Found", { status: 404 });
  }

  const [categories, shipping] = await Promise.all([
    catalogService.getCategories(),
    settingsService.getShippingConfig(),
  ]);
  const products = await listFeedProducts(getDb(), categories, (url) =>
    url.startsWith("http") ? url : absoluteUrl(url),
  );

  const xml = buildProductFeedXml(products, {
    siteName: siteConfig.name,
    siteUrl: getSiteUrl(),
    defaultBrand: siteConfig.name,
    shipping,
    productUrl: (slug) => absoluteUrl(`/urun/${slug}`),
    // Google taxonomy: Condiment / sauce (turşu, salamura, fermente gıda)
    googleProductCategory: "422",
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
