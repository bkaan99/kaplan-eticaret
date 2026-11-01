import { connection } from "next/server";
import { orderRepository } from "@/modules/orders/container";

/**
 * Süresi dolan ödeme bekleyen siparişleri iptal eder.
 * Cloudflare Cron Trigger bu uç noktayı çağırır (CRON_SECRET ile).
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env["CRON_SECRET"];
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const released = await orderRepository.releaseExpired(new Date());
  return Response.json({ ok: true, released });
}
