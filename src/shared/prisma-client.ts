import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../../generated/prisma/client";

/** Cloudflare D1 binding'inden PrismaClient (Workers / OpenNext). */
export function createPrismaClientFromD1(db: D1Database): PrismaClient {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
