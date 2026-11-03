import { NextResponse, type NextRequest } from "next/server";
import {
  CACHE_PRIVATE,
  CACHE_PUBLIC_HTML,
  CACHE_UPLOAD_ASSET,
  CDN_CACHE_UPLOAD,
  isPrivatePath,
  isPublicHtmlPath,
  isUploadPath,
} from "@/config/cache-policy";
import {
  SECURE_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/modules/auth/session-cookie";
import { CART_COOKIE_NAME } from "@/modules/cart/cart-cookie";

const SESSION_COOKIES = [SESSION_COOKIE_NAME, SECURE_SESSION_COOKIE_NAME];
const PERSONALIZATION_COOKIES = [...SESSION_COOKIES, CART_COOKIE_NAME];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

function hasPersonalizationCookie(request: NextRequest): boolean {
  return PERSONALIZATION_COOKIES.some((name) => request.cookies.has(name));
}

function withCacheHeaders(headers: Record<string, string>): NextResponse {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Admin oturum yönlendirmesi + path/çerez bazlı Cache-Control.
 * Kişiselleştirme (oturum / sepet) varsa HTML asla edge’de paylaşılmaz.
 * Anonim vitrin sayfaları kısa TTL ile Worker’ı baypas eder.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);
  const personalized = hasPersonalizationCookie(request);

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

  if (isPublicHtmlPath(pathname)) {
    // /ara?q=… sonuçları kişiye özel değil ama çok çeşitli — sadece boş liste cache.
    if (pathname === "/ara" && request.nextUrl.searchParams.has("q")) {
      return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
    }
    if (personalized) {
      return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
    }
    return withCacheHeaders({
      "Cache-Control": CACHE_PUBLIC_HTML,
      "CDN-Cache-Control": CACHE_PUBLIC_HTML,
      "Cloudflare-CDN-Cache-Control": CACHE_PUBLIC_HTML,
    });
  }

  // Eşleşen diğer yollar (ör. kendi-tursunu-yap): varsayılan private.
  return withCacheHeaders({ "Cache-Control": CACHE_PRIVATE });
}

export const config = {
  matcher: [
    "/",
    "/ara",
    "/ara/:path*",
    "/iletisim",
    "/sayfa/:path*",
    "/kendi-tursunu-yap",
    "/kendi-tursunu-yap/:path*",
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
