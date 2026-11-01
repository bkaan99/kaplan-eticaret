import type { D1Database } from "@cloudflare/workers-types";
import { getPlatformProxy } from "wrangler";
import { createDb, type Db } from "../../src/db";

export interface OpenedDb {
  db: Db;
  close(): Promise<void>;
}

/**
 * Komut satırı betikleri için D1 bağlantısı.
 * - yerel: `.wrangler/state` altındaki D1 (migration'lar: `npm run db:migrate-local`)
 * - uzak (`remote: true`): Cloudflare'deki gerçek D1
 */
export async function openDb(options: { remote?: boolean } = {}): Promise<OpenedDb> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: options.remote ? "wrangler.seed.jsonc" : "wrangler.scripts.jsonc",
    remoteBindings: options.remote === true,
    persist: options.remote ? false : undefined,
  });
  if (!proxy.env.DB) throw new Error("D1 binding (DB) bulunamadı");

  return { db: createDb(proxy.env.DB), close: () => proxy.dispose() };
}
