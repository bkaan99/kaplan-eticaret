import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../../generated/prisma/client";

/** Yerel SQLite (`file:./dev.db`) PrismaClient. better-sqlite3 yalnızca Node'da yüklenir. */
export function createPrismaClient(connectionString: string): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as {
    PrismaBetterSqlite3: new (config: { url: string }) => unknown;
  };
  const url = connectionString.startsWith("file:")
    ? connectionString.slice("file:".length)
    : connectionString;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter: adapter as never });
}

/** Cloudflare D1 binding'inden PrismaClient. */
export function createPrismaClientFromD1(db: D1Database): PrismaClient {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
