import { connection } from "next/server";
import { authorizeCronRequest } from "@/shared/cron-auth";
import { getRateLimiter } from "@/shared/rate-limit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  await connection();
  if (!authorizeCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const removed = await getRateLimiter().purgeExpired(
    new Date(Date.now() - DAY_MS),
  );
  return Response.json({ ok: true, removed });
}
