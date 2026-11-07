import { siteConfig } from "@/config/site.config";
import { cartService } from "@/modules/cart/container";
import { getAuditLogger } from "@/shared/audit";
import { logger } from "@/shared/logger";
import type { JobQueue } from "@/shared/queue";
import { getRateLimiter } from "@/shared/rate-limit";

export const JOB_PURGE_RATE_LIMITS = "maintenance.purge-rate-limits";
export const JOB_PURGE_AUDIT_LOG = "maintenance.purge-audit-log";
export const JOB_PURGE_ABANDONED_CARTS = "maintenance.purge-abandoned-carts";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function registerMaintenanceJobs(queue: JobQueue): Promise<void> {
  await queue.process(JOB_PURGE_RATE_LIMITS, async () => {
    const removed = await getRateLimiter().purgeExpired(
      new Date(Date.now() - DAY_MS),
    );
    logger.info({ removed }, "Rate limit kayıtları temizlendi");
  });

  await queue.process(JOB_PURGE_AUDIT_LOG, async () => {
    const cutoff = new Date(
      Date.now() - siteConfig.auditLog.retentionDays * DAY_MS,
    );
    const removed = await getAuditLogger().purgeOlderThan(cutoff);
    logger.info({ removed }, "Süresi dolan denetim kayıtları silindi");
  });

  await queue.process(JOB_PURGE_ABANDONED_CARTS, async () => {
    const days = siteConfig.cart?.abandonedRetentionDays ?? 30;
    const cutoff = new Date(Date.now() - days * DAY_MS);
    const removed = await cartService.purgeAbandoned(cutoff);
    logger.info({ removed }, "Terk edilmiş sahipsiz sepetler temizlendi");
  });

  await queue.schedule(JOB_PURGE_RATE_LIMITS, "0 * * * *");
  await queue.schedule(JOB_PURGE_AUDIT_LOG, "30 3 * * *");
  await queue.schedule(JOB_PURGE_ABANDONED_CARTS, "30 3 * * *");
}
