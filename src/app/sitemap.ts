import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { catalogService } from "@/modules/catalog/container";
import { getContentService } from "@/modules/content/container";
import { LEGAL_PAGE_TEMPLATES } from "@/modules/content/legal-templates";
import { absoluteUrl } from "@/shared/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Veritabanından okunur; build sırasında değil istek anında üretilir.
  await connection();

  const [categories, products, pages] = await Promise.all([
    catalogService.getCategories(),
    catalogService.listProductSlugs(),
    getContentService().publishedPageSlugs(),
  ]);

  const existingPageSlugs = new Set(pages.map((p) => p.slug));
  const fallbackPages = LEGAL_PAGE_TEMPLATES.filter(
    (t) => !existingPageSlugs.has(t.slug),
  ).map((t) => ({
    slug: t.slug,
    updatedAt: new Date(),
  }));
  const allPages = [...pages, ...fallbackPages];

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/kendi-tursunu-yap"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/iletisim"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/kategori/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...allPages.map((page) => ({
      url: absoluteUrl(`/sayfa/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...products
      .filter((product) => product.slug !== "kendi-tursunu-yap")
      .map((product) => ({
        url: absoluteUrl(`/urun/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
