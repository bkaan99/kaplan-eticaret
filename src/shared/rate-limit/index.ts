import "server-only";
import { headers } from "next/headers";
import { getDb } from "../db";
import { RateLimitError } from "../errors";
import { PrismaRateLimiter } from "./prisma-rate-limiter";
import type { RateLimitPolicy, RateLimiter } from "./rate-limiter";

export * from "./rate-limiter";

let limiter: RateLimiter | undefined;

export function getRateLimiter(): RateLimiter {
  limiter ??= new PrismaRateLimiter(getDb());
  return limiter;
}

/** İsteği yapan istemcinin IP adresi (CF / reverse proxy başlıklarından). */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Limit aşıldıysa RateLimitError fırlatır. */
export async function enforceRateLimit(
  scope: string,
  identifier: string,
  policy: RateLimitPolicy,
): Promise<void> {
  const result = await getRateLimiter().consume(
    `${scope}:${identifier}`,
    policy,
  );
  if (!result.allowed) {
    throw new RateLimitError();
  }
}
