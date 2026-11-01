import type { D1Database } from "@cloudflare/workers-types";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";
export { decimal, json, newId, timestamp } from "./types";

export type Db = DrizzleD1Database<typeof schema>;

/** D1 binding'inden Drizzle istemcisi. */
export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema });
}

type BatchQuery = Parameters<Db["batch"]>[0][number];

/**
 * D1'de interaktif transaction yok; sorgular tek `batch` içinde atomik çalışır
 * (hepsi ya da hiçbiri). Boş liste güvenle yok sayılır.
 */
export async function runBatch(
  db: Db,
  queries: BatchQuery[],
): Promise<unknown[]> {
  if (queries.length === 0) return [];
  return db.batch(queries as [BatchQuery, ...BatchQuery[]]);
}

/** SQLite benzersizlik (UNIQUE / PRIMARY KEY) kısıtı ihlali mi? Drizzle hatayı `cause` içinde sarar. */
export function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 4; depth++) {
    const message = String((e as { message?: unknown }).message ?? "");
    if (
      /UNIQUE constraint failed|PRIMARY KEY constraint failed|SQLITE_CONSTRAINT/i.test(
        message,
      )
    ) {
      return true;
    }
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
