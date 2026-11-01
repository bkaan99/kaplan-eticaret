import "server-only";
import { getCloudflareEnv } from "./cloudflare";
import { getEnv } from "./env";
import {
  createPrismaClient,
  createPrismaClientFromD1,
  type PrismaClient,
} from "./prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Uygulama genelinde tek PrismaClient. Yalnızca repository katmanı kullanır;
 * servisler ve UI doğrudan erişmez.
 *
 * Workers'ta D1 binding (`env.DB`); Node/dev'de `DATABASE_URL`.
 */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const cf = getCloudflareEnv();
  if (cf?.DB) {
    globalForPrisma.prisma = createPrismaClientFromD1(cf.DB);
    return globalForPrisma.prisma;
  }

  globalForPrisma.prisma = createPrismaClient(getEnv().DATABASE_URL);
  return globalForPrisma.prisma;
}
