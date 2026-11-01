import type { R2Bucket } from "@cloudflare/workers-types";
import type { FileStorage, StoredFile } from "./storage";

/** Cloudflare R2 üzerinde FileStorage. */
export class R2FileStorage implements FileStorage {
  constructor(
    private readonly bucket: R2Bucket,
    /** Relative `/uploads` veya absolute CDN (r2.dev / custom domain). */
    private readonly publicBasePath = "/uploads",
  ) {}

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.bucket.put(key, data, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    const base = this.publicBasePath.replace(/\/$/, "");
    return `${base}/${key}`;
  }

  async read(key: string): Promise<StoredFile | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    const bytes = new Uint8Array(await object.arrayBuffer());
    return {
      data: Buffer.from(bytes),
      contentType:
        object.httpMetadata?.contentType ?? "application/octet-stream",
    };
  }

  async remove(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
