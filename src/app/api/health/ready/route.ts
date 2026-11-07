import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { authorizeCronRequest } from "@/shared/cron-auth";
import { getDb } from "@/shared/db";
import { reportError } from "@/shared/error-reporter";
import { getJobQueue } from "@/shared/queue";

type CheckResult = "ok" | "fail";

async function checkDatabase(): Promise<CheckResult> {
  try {
    await getDb().run(sql`SELECT 1`);
    return "ok";
  } catch (error) {
    reportError(error, { check: "database" });
    return "fail";
  }
}

async function checkQueue(): Promise<CheckResult> {
  return (await getJobQueue().healthCheck()) ? "ok" : "fail";
}

/**
 * Readiness: trafik almaya hazır mı? Bağımlılıkları kontrol eder.
 * Altyapı sondaları CRON_SECRET Bearer ile yetkilendirilir (liveness açık kalır).
 */
export async function GET(request: Request) {
  await connection();

  if (!authorizeCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [database, queue] = await Promise.all([checkDatabase(), checkQueue()]);
  const checks = { database, queue };
  const ready = Object.values(checks).every((result) => result === "ok");

  return Response.json(
    { status: ready ? "ready" : "unavailable", checks },
    { status: ready ? 200 : 503 },
  );
}
