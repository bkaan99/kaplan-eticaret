import { describe, expect, it } from "vitest";
import {
  CACHE_PUBLIC_HTML,
  isCatalogPath,
  isPrivatePath,
  isPublicHtmlPath,
  isSeoFeedPath,
  isUploadPath,
  SETTINGS_CACHE_REVALIDATE_SECONDS,
  STOREFRONT_PROCESS_TTL_MS,
} from "./cache-policy";

describe("cache-policy", () => {
  it("anonim HTML edge TTL en az 5 dk + uzun SWR", () => {
    expect(CACHE_PUBLIC_HTML).toContain("s-maxage=300");
    expect(CACHE_PUBLIC_HTML).toContain("stale-while-revalidate=3600");
    expect(STOREFRONT_PROCESS_TTL_MS).toBeGreaterThanOrEqual(180_000);
    expect(SETTINGS_CACHE_REVALIDATE_SECONDS).toBeGreaterThanOrEqual(300);
  });

  it("vitrin yollarını public, hesap/api yollarını private sayar", () => {
    expect(isPublicHtmlPath("/")).toBe(true);
    expect(isCatalogPath("/urun/kornison")).toBe(true);
    expect(isCatalogPath("/kategori/klasik-tursular")).toBe(true);
    expect(isPrivatePath("/hesabim")).toBe(true);
    expect(isPrivatePath("/api/storefront/shell")).toBe(true);
    expect(isSeoFeedPath("/sitemap.xml")).toBe(true);
    expect(isUploadPath("/uploads/a.webp")).toBe(true);
  });
});
