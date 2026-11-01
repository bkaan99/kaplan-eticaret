import "server-only";
import path from "node:path";
import { getCloudflareEnv } from "../cloudflare";
import { getEnv } from "../env";
import { LocalDiskStorage } from "./local-storage";
import { R2FileStorage } from "./r2-storage";
import type { FileStorage } from "./storage";

let storage: FileStorage | undefined;

/** Uygulamanın dosya deposu. Workers'ta R2; yerelde disk. */
export function getFileStorage(): FileStorage {
  if (storage) return storage;

  const cf = getCloudflareEnv();
  if (cf?.UPLOADS) {
    storage = new R2FileStorage(cf.UPLOADS);
    return storage;
  }

  storage = new LocalDiskStorage(
    path.resolve(/* turbopackIgnore: true */ getEnv().UPLOAD_DIR ?? "uploads"),
  );
  return storage;
}
