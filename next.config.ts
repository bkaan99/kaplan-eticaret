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

/** next/image allow-list; build zamanında sabitlenir (wrangler vars runtime'da gelir). */
function uploadsRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const hosts = new Set<string>([
    // wrangler.jsonc UPLOADS_PUBLIC_BASE_URL ile aynı
    "pub-dd08ce634607423dbc1eca3011d2c210.r2.dev",
  ]);

  const fromEnv = process.env.UPLOADS_PUBLIC_BASE_URL?.trim();
  if (fromEnv) {
    try {
      hosts.add(new URL(fromEnv).hostname);
    } catch {
      // geçersiz URL — yok say
    }
  }

  return [...hosts].map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/**",
  }));
}

const nextConfig: NextConfig = {
  // `cacheComponents` / `partialPrefetching` (PPR) bilinçli olarak kapalı: OpenNext Cloudflare üretim Worker'ında
  // sayfalar "Worker code had hung" hatasıyla 500 dönüyor. Açmadan önce Worker'da tüm sayfaları doğrulayın.
  serverExternalPackages: ["pino"],
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: uploadsRemotePatterns(),
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
