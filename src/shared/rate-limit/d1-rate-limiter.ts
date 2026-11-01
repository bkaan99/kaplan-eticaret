import { lt, sql } from "drizzle-orm";
import { rateLimit, type Db } from "@/db";
import type { RateLimitPolicy, RateLimitResult, RateLimiter } from "./rate-limiter";

/**
 * Sabit pencereli sayaç. Tek `INSERT ... ON CONFLICT DO UPDATE` ile atomik artar;
 * eşzamanlı isteklerde sayım kaybolmaz.
 */
export class D1RateLimiter implements RateLimiter {
  constructor(
    private readonly source: Db | (() => Db),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private get db(): Db {
    return typeof this.source === "function" ? this.source() : this.source;
  }

  async consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const nowMs = this.now().getTime();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);

    const [row] = await this.db
      .insert(rateLimit)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimit.key, rateLimit.windowStart],
        set: { count: sql`${rateLimit.count} + 1` },
      })
      .returning({ count: rateLimit.count });
    const count = row!.count;

    const windowEnd = windowStart.getTime() + windowMs;

    return {
      allowed: count <= policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - nowMs) / 1000)),
    };
  }

  async purgeExpired(olderThan: Date): Promise<number> {
    const result = await this.db
      .delete(rateLimit)
      .where(lt(rateLimit.windowStart, olderThan))
      .run();
    return result.meta.changes;
  }
}
