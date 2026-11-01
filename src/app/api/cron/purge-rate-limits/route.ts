import { connection } from "next/server";
import { getRateLimiter } from "@/shared/rate-limit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  await connection();
  const secret = process.env["CRON_SECRET"];
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const removed = await getRateLimiter().purgeExpired(
    new Date(Date.now() - DAY_MS),
  );
  return Response.json({ ok: true, removed });
}
