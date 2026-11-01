import "server-only";
import { createDb, type Db } from "@/db";
import { getCloudflareEnv } from "./cloudflare";

const globalForDb = globalThis as unknown as { db?: Db };

/**
 * Uygulama genelinde tek Drizzle istemcisi — yalnızca D1.
 * Yerel `next dev` OpenNext `initOpenNextCloudflareForDev` ile D1 bağlar.
 */
export function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  const cf = getCloudflareEnv();
  if (!cf?.DB) {
    throw new Error(
      "D1 binding (env.DB) bulunamadı. Yerelde `next dev` (OpenNext) veya Workers deploy kullanın.",
    );
  }

  globalForDb.db = createDb(cf.DB);
  return globalForDb.db;
}

export type { Db };
