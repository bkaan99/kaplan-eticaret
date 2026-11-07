import { connection } from "next/server";
import { getOrderService } from "@/modules/orders/container";
import { authorizeCronRequest } from "@/shared/cron-auth";

/**
 * Süresi dolan ödeme bekleyen siparişleri iptal eder.
 * Cloudflare Cron Trigger bu uç noktayı çağırır (CRON_SECRET ile).
 */
export async function GET(request: Request) {
  await connection();
  if (!authorizeCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const released = await getOrderService().releaseExpired(new Date());
  return Response.json({ ok: true, released });
}
