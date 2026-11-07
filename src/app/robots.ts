import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/site-url";

/** Private / auth yüzeyleri — genel ve AI bot kurallarında ortak. */
const PRIVATE_DISALLOW = [
  "/admin",
  "/api/",
  "/sepet",
  "/odeme",
  "/hesabim",
  "/siparis",
  "/siparis-sorgula",
  "/favoriler",
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-sifirla",
  "/dogrula",
  "/bayi-basvuru",
  "/ara?*",
] as const;

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_DISALLOW],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot-Extended",
        ],
        allow: [
          "/",
          "/llms.txt",
          "/kategori/",
          "/urun/",
          "/sayfa/",
          "/iletisim",
          "/kendi-tursunu-yap",
          "/feeds/products.xml",
        ],
        disallow: [...PRIVATE_DISALLOW],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
