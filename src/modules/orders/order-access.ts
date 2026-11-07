import "server-only";
import { cookies } from "next/headers";

export {
  orderAccessPath,
  orderAccessUrl,
  safeNextPath,
} from "./order-access-path";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/** Sipariş bazlı httpOnly erişim çerezi adı. */
export function orderAccessCookieName(orderNumber: string): string {
  const safe = orderNumber.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  return `oa_${safe || "order"}`;
}

/** Token'ı httpOnly çereze yazar; sonraki isteklerde query gerekmez. */
export async function setOrderAccessCookie(
  orderNumber: string,
  token: string,
): Promise<void> {
  const jar = await cookies();
  jar.set(orderAccessCookieName(orderNumber), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Sayfa/aksiyonlar için sipariş erişim token'ını çerezden okur. */
export async function readOrderAccessToken(
  orderNumber: string,
): Promise<string | null> {
  const jar = await cookies();
  return jar.get(orderAccessCookieName(orderNumber))?.value ?? null;
}
