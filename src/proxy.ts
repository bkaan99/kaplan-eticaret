import { NextResponse, type NextRequest } from "next/server";
import {
  CACHE_CATALOG_HTML,
  CACHE_PRIVATE,
  CACHE_UPLOAD_ASSET,
  CDN_CACHE_UPLOAD,
  isCatalogPath,
  isPrivatePath,
  isUploadPath,
} from "@/config/cache-policy";
import {
  SECURE_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/modules/auth/session-cookie";

const SESSION_COOKIES = [SESSION_COOKIE_NAME, SECURE_SESSION_COOKIE_NAME];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

function withCacheHeaders(
  headers: Record<string, string>,
): NextResponse {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Admin için hızlı oturum yönlendirmesi + path bazlı Cache-Control.
 * Asıl yetki kontrolü veri erişim katmanında (requirePermission) yapılır.
 * Ürün/kategori: oturum yoksa edge cache; oturum varsa (bayi fiyatı) no-store.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!authed) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.headers.set("Cache-Control", CACHE_PRIVATE);
      return redirect;
    }
    return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
  }

  if (isPrivatePath(pathname) || pathname.startsWith("/api/")) {
    return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
  }

  if (isUploadPath(pathname)) {
    return withCacheHeaders({
      "Cache-Control": CACHE_UPLOAD_ASSET,
      "CDN-Cache-Control": CDN_CACHE_UPLOAD,
      "Cloudflare-CDN-Cache-Control": CDN_CACHE_UPLOAD,
    });
  }

  if (isCatalogPath(pathname)) {
    if (authed) {
      return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
    }
    return withCacheHeaders({
      "Cache-Control": CACHE_CATALOG_HTML,
      "CDN-Cache-Control": CACHE_CATALOG_HTML,
      "Cloudflare-CDN-Cache-Control": CACHE_CATALOG_HTML,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/sepet",
    "/sepet/:path*",
    "/hesabim",
    "/hesabim/:path*",
    "/odeme",
    "/odeme/:path*",
    "/favoriler",
    "/favoriler/:path*",
    "/giris",
    "/kayit",
    "/sifremi-unuttum",
    "/sifre-sifirla",
    "/dogrula",
    "/bayi-basvuru",
    "/urun/:path*",
    "/kategori/:path*",
    "/uploads/:path*",
    "/api/:path*",
  ],
};
