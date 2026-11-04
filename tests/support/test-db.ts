import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { D1Database } from "@cloudflare/workers-types";
import { getPlatformProxy } from "wrangler";
import { createDb, type Db } from "../../src/db";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../../db/migrations");

export interface TestDb {
  db: Db;
  d1: D1Database;
  close(): Promise<void>;
}

/** SQL dosyasını `;` ile ifadelere böler (DDL'de metin içinde `;` yoktur). */
function statements(sql: string): string[] {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Bellek içi D1 (wrangler/workerd) — canlıdaki D1 ile aynı SQLite çalışma zamanı.
 * Tüm migration'ları uygulanmış boş bir veritabanı döner.
 */
export async function createTestDb(): Promise<TestDb> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: path.resolve(import.meta.dirname, "wrangler.test.jsonc"),
    persist: false,
  });
  const d1 = proxy.env.DB;

  // Canlıdaki gibi tüm migration'lar sırayla uygulanır (0001, 0002, …).
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    await d1.batch(statements(sql).map((s) => d1.prepare(s)));
  }

  return { db: createDb(d1), d1, close: () => proxy.dispose() };
}
