import type { D1Database } from "@cloudflare/workers-types";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../../generated/prisma/client";

/** Yerel SQLite (`file:./dev.db` veya `:memory:`) PrismaClient. */
export function createPrismaClient(connectionString: string): PrismaClient {
  const url = connectionString.startsWith("file:")
    ? connectionString.slice("file:".length)
    : connectionString;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

/** Cloudflare D1 binding'inden PrismaClient. */
export function createPrismaClientFromD1(db: D1Database): PrismaClient {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
