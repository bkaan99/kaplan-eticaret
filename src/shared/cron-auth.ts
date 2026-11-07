import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

/**
 * Cron / health-ready Bearer doğrulaması.
 * Secret yoksa veya eşleşmezse false (çağıran 401 döner).
 */
export function authorizeCronRequest(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = header.slice("Bearer ".length);
  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
