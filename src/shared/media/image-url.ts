/**
 * Opsiyonel Cloudflare Image Resizing (/cdn-cgi/image/...).
 * Yalnızca UPLOADS_PUBLIC_BASE_URL kendi CF zone’unuzdayken anlamlıdır
 * (r2.dev bu yolu desteklemez). Aksi halde orijinal URL döner.
 */
export function resizeImageUrl(
  src: string,
  options: { width?: number; height?: number; quality?: number } = {},
): string {
  if (!src || !process.env.CF_IMAGE_RESIZING) return src;

  const base = process.env.UPLOADS_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base || (!src.startsWith(base) && !src.startsWith("/uploads/"))) {
    return src;
  }

  const parts: string[] = [];
  if (options.width) parts.push(`width=${options.width}`);
  if (options.height) parts.push(`height=${options.height}`);
  if (options.quality) parts.push(`quality=${options.quality}`);
  parts.push("format=auto");

  const path = src.startsWith("http")
    ? new URL(src).pathname
    : src.startsWith("/")
      ? src
      : `/${src}`;

  // Zone üzerinde Image Resizing: /cdn-cgi/image/<opts>/<path>
  return `/cdn-cgi/image/${parts.join(",")}${path}`;
}
