import { afterEach, describe, expect, it, vi } from "vitest";
import { isCdnResizedImageUrl, resizeImageUrl } from "./image-url";

describe("image-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("CF_IMAGE_RESIZING tanımlı değilse veya 'false' ise orijinal URL döner", () => {
    vi.stubEnv("UPLOADS_PUBLIC_BASE_URL", "https://cdn.example.com");
    expect(
      resizeImageUrl("https://cdn.example.com/uploads/tursu.webp", {
        width: 600,
      }),
    ).toBe("https://cdn.example.com/uploads/tursu.webp");

    vi.stubEnv("CF_IMAGE_RESIZING", "false");
    expect(
      resizeImageUrl("https://cdn.example.com/uploads/tursu.webp", {
        width: 600,
      }),
    ).toBe("https://cdn.example.com/uploads/tursu.webp");
  });

  it("CF_IMAGE_RESIZING='true' ve kendi domainimizdeyken /cdn-cgi/image/ URL üretir", () => {
    vi.stubEnv("CF_IMAGE_RESIZING", "true");
    vi.stubEnv("UPLOADS_PUBLIC_BASE_URL", "https://cdn.example.com/");

    expect(
      resizeImageUrl("https://cdn.example.com/uploads/tursu.webp", {
        width: 600,
        quality: 80,
      }),
    ).toBe(
      "/cdn-cgi/image/width=600,quality=80,format=auto/uploads/tursu.webp",
    );

    expect(resizeImageUrl("/uploads/tursu.webp", { width: 400 })).toBe(
      "/cdn-cgi/image/width=400,format=auto/uploads/tursu.webp",
    );
  });

  it("harici domain URL'lerini değiştirmez", () => {
    vi.stubEnv("CF_IMAGE_RESIZING", "true");
    vi.stubEnv("UPLOADS_PUBLIC_BASE_URL", "https://cdn.example.com");

    expect(
      resizeImageUrl("https://pub-123.r2.dev/uploads/tursu.webp", {
        width: 600,
      }),
    ).toBe("https://pub-123.r2.dev/uploads/tursu.webp");
  });

  it("isCdnResizedImageUrl yalnızca /cdn-cgi/image/ yolları için true döner", () => {
    expect(
      isCdnResizedImageUrl(
        "/cdn-cgi/image/width=600,format=auto/uploads/a.webp",
      ),
    ).toBe(true);
    expect(isCdnResizedImageUrl("https://pub-123.r2.dev/a.webp")).toBe(false);
    expect(isCdnResizedImageUrl("/placeholder.svg")).toBe(false);
    expect(isCdnResizedImageUrl(null)).toBe(false);
    expect(isCdnResizedImageUrl(undefined)).toBe(false);
  });
});
