import { connection } from "next/server";
import { NextResponse } from "next/server";
import {
  safeNextPath,
  setOrderAccessCookie,
} from "@/modules/orders/order-access";
import { getOrderService } from "@/modules/orders/container";
import { isAppError } from "@/shared/errors";

/**
 * Query'deki lookup token'ı httpOnly çereze alır ve temiz sipariş URL'sine yönlendirir.
 * E-posta / SMS / ödeme dönüş linkleri bu uçtan geçer.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  await connection();
  const { orderNumber } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const durum = url.searchParams.get("durum");
  const next = url.searchParams.get("next");

  if (!token) {
    return NextResponse.redirect(
      new URL(`/siparis/${orderNumber}`, url.origin),
    );
  }

  try {
    await getOrderService().getForAccess(orderNumber, { lookupToken: token });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.redirect(new URL("/siparis-sorgula", url.origin));
    }
    throw error;
  }

  await setOrderAccessCookie(orderNumber, token);

  const fallback = `/siparis/${orderNumber}${
    durum ? `?durum=${encodeURIComponent(durum)}` : ""
  }`;
  const target = safeNextPath(next, fallback);
  const allowedPrefix = `/siparis/${orderNumber}`;
  const odemePrefix = `/odeme/ode/${orderNumber}`;
  const odemeDevPrefix = `/odeme/gelistirme/${orderNumber}`;
  const safeTarget =
    target === allowedPrefix ||
    target.startsWith(`${allowedPrefix}?`) ||
    target.startsWith(odemePrefix) ||
    target.startsWith(odemeDevPrefix)
      ? target
      : fallback;

  return NextResponse.redirect(new URL(safeTarget, url.origin));
}
