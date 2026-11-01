import type { PrismaClient } from "../prisma-client";
import type {
  RateLimitPolicy,
  RateLimitResult,
  RateLimiter,
} from "./rate-limiter";

/**
 * Sabit pencereli sayaç. Prisma upsert kullanır (SQLite/D1 uyumlu);
 * find+create/update'e göre daha az yarışlıdır. Rate limit için yeterlidir.
 */
export class PrismaRateLimiter implements RateLimiter {
  constructor(
    private readonly db: PrismaClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async consume(
    key: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitResult> {
    const nowMs = this.now().getTime();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);

    const existing = await this.db.rateLimit.findUnique({
      where: { key_windowStart: { key, windowStart } },
      select: { count: true },
    });

    let count: number;
    if (!existing) {
      try {
        await this.db.rateLimit.create({
          data: { key, windowStart, count: 1 },
        });
        count = 1;
      } catch {
        // Eşzamanlı create: satır oluşmuş; artır.
        const updated = await this.db.rateLimit.update({
          where: { key_windowStart: { key, windowStart } },
          data: { count: { increment: 1 } },
          select: { count: true },
        });
        count = updated.count;
      }
    } else {
      const updated = await this.db.rateLimit.update({
        where: { key_windowStart: { key, windowStart } },
        data: { count: { increment: 1 } },
        select: { count: true },
      });
      count = updated.count;
    }

    const windowEnd = windowStart.getTime() + windowMs;

    return {
      allowed: count <= policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - nowMs) / 1000)),
    };
  }

  async purgeExpired(olderThan: Date): Promise<number> {
    const result = await this.db.rateLimit.deleteMany({
      where: { windowStart: { lt: olderThan } },
    });
    return result.count;
  }
}
