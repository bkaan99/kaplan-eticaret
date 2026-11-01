import "server-only";
import { getCloudflareEnv } from "./cloudflare";
import {
  createPrismaClientFromD1,
  type PrismaClient,
} from "./prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Uygulama genelinde tek PrismaClient — yalnızca D1.
 * Yerel `next dev` OpenNext `initOpenNextCloudflareForDev` ile D1 bağlar.
 * CLI seed/admin: `prisma-client-node` (Workers bundle'a girmez).
 */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const cf = getCloudflareEnv();
  if (!cf?.DB) {
    throw new Error(
      "D1 binding (env.DB) bulunamadı. Yerelde `next dev` (OpenNext) veya Workers deploy kullanın.",
    );
  }

  globalForPrisma.prisma = createPrismaClientFromD1(cf.DB);
  return globalForPrisma.prisma;
}
