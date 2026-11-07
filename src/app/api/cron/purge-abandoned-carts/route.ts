import { connection } from "next/server";
import { siteConfig } from "@/config/site.config";
import { cartService } from "@/modules/cart/container";
import { authorizeCronRequest } from "@/shared/cron-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Terk edilmiş sahipsiz (anonim) sepetleri ve satırlarını temizler.
 * Cloudflare Cron Trigger bu uç noktayı çağırır (CRON_SECRET ile).
 */
export async function GET(request: Request) {
  await connection();
  if (!authorizeCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const days = siteConfig.cart?.abandonedRetentionDays ?? 30;
  const cutoff = new Date(Date.now() - days * DAY_MS);
  const removed = await cartService.purgeAbandoned(cutoff);
  return Response.json({ ok: true, removed, cutoff: cutoff.toISOString() });
}
