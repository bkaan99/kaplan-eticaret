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
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
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
