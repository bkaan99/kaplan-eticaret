import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "./security-headers";

function headerValue(isProduction: boolean, key: string): string | undefined {
  return buildSecurityHeaders(isProduction).find((h) => h.key === key)?.value;
}

describe("buildSecurityHeaders", () => {
  it("çerçeve içine gömmeyi engeller", () => {
    expect(headerValue(true, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(true, "Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("PayTR iFrame'ine izin verir", () => {
    expect(headerValue(true, "Content-Security-Policy")).toContain(
      "frame-src https://www.paytr.com",
    );
  });

  it("iletişim sayfasındaki Google Haritalar iFrame'ine izin verir", () => {
    expect(headerValue(true, "Content-Security-Policy")).toMatch(
      /frame-src [^;]*https:\/\/www\.google\.com/,
    );
  });

  it("Turnstile script ve connect kaynağına izin verir", () => {
    const csp = headerValue(true, "Content-Security-Policy")!;
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("connect-src");
  });

  it("HSTS yalnızca production'da eklenir", () => {
    expect(headerValue(true, "Strict-Transport-Security")).toBeDefined();
    expect(headerValue(false, "Strict-Transport-Security")).toBeUndefined();
  });

  it("unsafe-eval yalnızca geliştirmede eklenir", () => {
    expect(headerValue(false, "Content-Security-Policy")).toContain(
      "'unsafe-eval'",
    );
    expect(headerValue(true, "Content-Security-Policy")).not.toContain(
      "'unsafe-eval'",
    );
  });
});
