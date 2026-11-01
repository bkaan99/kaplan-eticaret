import "server-only";
import { getCloudflareEnv } from "./cloudflare";
import { getEnv } from "./env";
import { createPrismaClientFromD1, type PrismaClient } from "./prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Uygulama genelinde tek PrismaClient.
 * Workers'ta D1 (`env.DB`); yerelde Node SQLite client (`generated/prisma-node`).
 */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const cf = getCloudflareEnv();
  if (cf?.DB) {
    globalForPrisma.prisma = createPrismaClientFromD1(cf.DB);
    return globalForPrisma.prisma;
  }

  // Yerel Next/dev: cloudflare WASM runtime yerine Node client.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const node = require("./prisma-client-node") as typeof import("./prisma-client-node");
  globalForPrisma.prisma = node.createPrismaClient(
    getEnv().DATABASE_URL,
  ) as unknown as PrismaClient;
  return globalForPrisma.prisma;
}
