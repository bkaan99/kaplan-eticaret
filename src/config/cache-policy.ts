/** HTTP / Workers Cache politikaları (Cache-Control). */

export const CACHE_PRIVATE =
  "private, no-store, no-cache, max-age=0, must-revalidate";

/**
 * Anonim vitrin HTML — edge kısa TTL + SWR.
 * Yönetim paneli değişiklikleri edge önbelleğini temizleyemez (workers.dev'de purge yok),
 * bu yüzden bayat süre en fazla ~2 dk tutulur: s-maxage 60 + SWR 60.
 */
export const CACHE_PUBLIC_HTML =
  "public, s-maxage=60, stale-while-revalidate=60";

/** Public katalog API (varsa) — daha kısa edge TTL. */
export const CACHE_CATALOG_API =
  "public, s-maxage=30, stale-while-revalidate=120";

/** sitemap / robots / llms / feed — edge 1 saat + SWR. */
export const CACHE_SEO_FEED =
  "public, max-age=3600, stale-while-revalidate=86400";

/** R2 /uploads görselleri — içerik adresi değişmez (uuid). */
export const CACHE_UPLOAD_ASSET = "public, max-age=31536000, immutable";

/** Edge-only TTL; tarayıcıya sızmaz (Workers Caching). */
export const CDN_CACHE_UPLOAD = "public, max-age=31536000, immutable";

const PRIVATE_PREFIXES = [
  "/admin",
  "/sepet",
  "/hesabim",
  "/odeme",
  "/favoriler",
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-sifirla",
  "/dogrula",
  "/bayi-basvuru",
  "/siparis",
  "/siparis-sorgula",
  "/api/auth",
  "/api/cron",
  "/api/payments",
  "/api/storefront",
  "/api/cart",
  "/api/account",
  "/api/wishlist",
] as const;

/** Anonimken edge cache’lenebilir vitrin yolları. */
const PUBLIC_HTML_PREFIXES = ["/urun/", "/kategori/", "/sayfa/"] as const;

const PUBLIC_HTML_EXACT = [
  "/",
  "/iletisim",
  "/ara",
  "/kendi-tursunu-yap",
] as const;

const SEO_FEED_EXACT = [
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/feeds/products.xml",
] as const;

export function isSeoFeedPath(pathname: string): boolean {
  return SEO_FEED_EXACT.includes(
    pathname as (typeof SEO_FEED_EXACT)[number],
  );
}

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isCatalogPath(pathname: string): boolean {
  return (
    PUBLIC_HTML_EXACT.includes(
      pathname as (typeof PUBLIC_HTML_EXACT)[number],
    ) || PUBLIC_HTML_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function isPublicHtmlPath(pathname: string): boolean {
  return isCatalogPath(pathname);
}

export function isUploadPath(pathname: string): boolean {
  return pathname === "/uploads" || pathname.startsWith("/uploads/");
}
