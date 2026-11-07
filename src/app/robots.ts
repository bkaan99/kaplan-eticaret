import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
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
        ],
        disallow: [
          "/admin",
          "/api/",
          "/sepet",
          "/odeme",
          "/hesabim",
          "/siparis",
          "/kayit",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
