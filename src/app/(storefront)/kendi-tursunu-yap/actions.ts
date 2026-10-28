"use server";

import { revalidatePath } from "next/cache";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { cartService } from "@/modules/cart/container";
import {
  getCartIdentity,
  persistCartCookie,
} from "@/modules/cart/cart.session";
import { customPickleService } from "@/modules/custom-pickle/container";
import { isAppError } from "@/shared/errors";
import { reportError } from "@/shared/error-reporter";

export interface CustomPickleActionResult {
  ok: boolean;
  error?: string;
}

/** Müşterinin oluşturduğu bidonu doğrulayıp sepete ekler. */
export async function addCustomPickleAction(
  payload: unknown,
): Promise<CustomPickleActionResult> {
  try {
    const pricing = await getRequestPricing();
    if (!pricing.pricesVisible) {
      return { ok: false, error: "Sipariş için bayi girişi yapmalısınız." };
    }

    const prepared = await customPickleService.prepare(payload);
    const result = await cartService.addCustomItem(
      await getCartIdentity(),
      prepared.variantId,
      { key: prepared.key, customization: prepared.customization },
      prepared.quantity,
    );
    await persistCartCookie(result);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) return { ok: false, error: error.message };
    reportError(error, { action: "customPickle" });
    return { ok: false, error: "İşlem tamamlanamadı, lütfen tekrar deneyin." };
  }
}
