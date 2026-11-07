import { connection } from "next/server";
import { siteConfig } from "@/config/site.config";
import { getAuditLogger } from "@/shared/audit";
import { authorizeCronRequest } from "@/shared/cron-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  await connection();
  if (!authorizeCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - siteConfig.auditLog.retentionDays * DAY_MS,
  );
  const removed = await getAuditLogger().purgeOlderThan(cutoff);
  return Response.json({ ok: true, removed });
}
