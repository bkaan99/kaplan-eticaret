"use server";

import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { cartService } from "@/modules/cart/container";
import {
  getCartIdentity,
  persistCartCookie,
} from "@/modules/cart/cart.session";
import { customPickleService } from "@/modules/custom-pickle/container";
import { runStorefrontAction } from "@/shared/action";
import { ValidationError } from "@/shared/errors";

export interface CustomPickleActionResult {
  ok: boolean;
  error?: string;
}

/** Müşterinin oluşturduğu bidonu doğrulayıp sepete ekler. */
export async function addCustomPickleAction(
  payload: unknown,
): Promise<CustomPickleActionResult> {
  const pricing = await getRequestPricing();
  if (!pricing.pricesVisible) {
    return { ok: false, error: "Sipariş için bayi girişi yapmalısınız." };
  }

  return runStorefrontAction(
    async () => {
      const prepared = await customPickleService.prepare(payload);
      const result = await cartService.addCustomItem(
        await getCartIdentity(),
        prepared.variantId,
        { key: prepared.key, customization: prepared.customization },
        prepared.quantity,
      );
      await persistCartCookie(result);
    },
    {
      actionName: "customPickle",
      revalidate: ["/"],
    },
  );
}
