import type { NextConfig } from "next";
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

const nextConfig: NextConfig = {
  // `cacheComponents` / `partialPrefetching` (PPR) bilinçli olarak kapalı: OpenNext Cloudflare üretim Worker'ında
  // sayfalar "Worker code had hung" hatasıyla 500 dönüyor. Açmadan önce Worker'da tüm sayfaları doğrulayın.
  serverExternalPackages: ["pino"],
  images: {
    // R2 public (r2.dev) + ileride custom CDN; CF IMAGES binding /_next/image ile boyutlandırır.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-dd08ce634607423dbc1eca3011d2c210.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    // Cache-Control path politikası `src/proxy.ts` (oturum bilinçli).
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders(process.env.NODE_ENV === "production"),
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
