import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../../generated/prisma-node/client";

/** Node CLI (seed, create-admin) için SQLite PrismaClient. */
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

/** Node CLI'dan remote/local D1 binding. */
export function createPrismaClientFromD1(db: D1Database): PrismaClient {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
