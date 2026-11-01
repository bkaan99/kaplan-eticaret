/** HTTP / Workers Cache politikaları (Cache-Control). */

export const CACHE_PRIVATE =
  "private, no-store, no-cache, max-age=0, must-revalidate";

/** Anonim ürün/kategori HTML — edge kısa TTL + SWR. */
export const CACHE_CATALOG_HTML =
  "public, s-maxage=60, stale-while-revalidate=300";

/** Public katalog API (varsa) — daha kısa edge TTL. */
export const CACHE_CATALOG_API =
  "public, s-maxage=30, stale-while-revalidate=120";

/** R2 /uploads görselleri — içerik adresi değişmez (uuid). */
export const CACHE_UPLOAD_ASSET =
  "public, max-age=31536000, immutable";

/** Edge-only TTL; tarayıcıya sızmaz (Workers Caching). */
export const CDN_CACHE_UPLOAD =
  "public, max-age=31536000, immutable";

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
  "/api/auth",
  "/api/cron",
  "/api/payments",
] as const;

const CATALOG_PREFIXES = ["/urun/", "/kategori/"] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isCatalogPath(pathname: string): boolean {
  return CATALOG_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isUploadPath(pathname: string): boolean {
  return pathname === "/uploads" || pathname.startsWith("/uploads/");
}
