import type { NextConfig } from "next";
import {
  CACHE_CATALOG_HTML,
  CACHE_PRIVATE,
  CACHE_UPLOAD_ASSET,
} from "./src/config/cache-policy";
import { buildSecurityHeaders } from "./src/config/security-headers";

try {
  const { initOpenNextCloudflareForDev } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@opennextjs/cloudflare") as {
      initOpenNextCloudflareForDev: () => void;
    };
  initOpenNextCloudflareForDev();
} catch {
  // typecheck/CI ortamında wrangler log yazılamayabilir
}

function cacheHeader(value: string) {
  return [{ key: "Cache-Control", value }];
}

const nextConfig: NextConfig = {
  // `cacheComponents` / `partialPrefetching` (PPR) bilinçli olarak kapalı: OpenNext Cloudflare üretim Worker'ında
  // sayfalar "Worker code had hung" hatasıyla 500 dönüyor. Açmadan önce Worker'da tüm sayfaları doğrulayın.
  serverExternalPackages: ["pino"],
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    const security = buildSecurityHeaders(
      process.env.NODE_ENV === "production",
    );
    return [
      {
        source: "/:path*",
        headers: security,
      },
      // Baseline; oturumlu katalog için proxy no-store ile ezer.
      {
        source: "/urun/:path*",
        headers: cacheHeader(CACHE_CATALOG_HTML),
      },
      {
        source: "/kategori/:path*",
        headers: cacheHeader(CACHE_CATALOG_HTML),
      },
      {
        source: "/uploads/:path*",
        headers: cacheHeader(CACHE_UPLOAD_ASSET),
      },
      {
        source: "/sepet",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/sepet/:path*",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/hesabim",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/hesabim/:path*",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/admin",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/admin/:path*",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/odeme",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/odeme/:path*",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/favoriler",
        headers: cacheHeader(CACHE_PRIVATE),
      },
      {
        source: "/api/:path*",
        headers: cacheHeader(CACHE_PRIVATE),
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
