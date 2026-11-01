import { connection } from "next/server";
import { siteConfig } from "@/config/site.config";
import { getAuditLogger } from "@/shared/audit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  await connection();
  const secret = process.env["CRON_SECRET"];
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - siteConfig.auditLog.retentionDays * DAY_MS,
  );
  const removed = await getAuditLogger().purgeOlderThan(cutoff);
  return Response.json({ ok: true, removed });
}
