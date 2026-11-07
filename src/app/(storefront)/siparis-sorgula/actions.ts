"use server";

import { redirect } from "next/navigation";
import { setOrderAccessCookie } from "@/modules/orders/order-access";
import { getOrderService } from "@/modules/orders/container";
import { isAppError } from "@/shared/errors";
import {
  RATE_LIMIT_POLICIES,
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";

export interface LookupState {
  error?: string;
}

export async function lookupOrderAction(
  _previous: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!orderNumber || !email) {
    return {
      error: "Lütfen sipariş numaranızı ve e-posta adresinizi giriniz.",
    };
  }

  try {
    const ip = await getClientIp();
    await enforceRateLimit("order-lookup", ip, RATE_LIMIT_POLICIES.orderLookup);

    const order = await getOrderService().lookupByEmail(orderNumber, email);
    await setOrderAccessCookie(order.orderNumber, order.lookupToken);
    redirect(`/siparis/${order.orderNumber}`);
  } catch (error) {
    // redirect() özel bir hata fırlatır; uygulama hatası değilse yeniden fırlatılır.
    if (!isAppError(error)) throw error;
    if (error.code === "NOT_FOUND") {
      return {
        error:
          "Bu sipariş numarası ve e-posta ile eşleşen bir sipariş bulunamadı. Lütfen bilgilerinizi kontrol ediniz.",
      };
    }
    return { error: error.message };
  }
}
