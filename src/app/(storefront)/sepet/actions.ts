"use server";

import { revalidatePath } from "next/cache";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { cartService } from "@/modules/cart/container";
import {
  getCartIdentity,
  persistCartCookie,
} from "@/modules/cart/cart.session";
import type { CartView } from "@/modules/cart/cart.types";
import { runStorefrontAction } from "@/shared/action";

export interface CartActionResult {
  ok: boolean;
  error?: string;
  cart?: CartView;
}

async function run(
  operation: (
    identity: Awaited<ReturnType<typeof getCartIdentity>>,
  ) => ReturnType<typeof cartService.addItem>,
): Promise<CartActionResult> {
  const result = await runStorefrontAction(
    async () => {
      const outcome = await operation(await getCartIdentity());
      await persistCartCookie(outcome);
      return outcome.cart;
    },
    {
      actionName: "cart",
      revalidate: ["/"],
    },
  );

  return { ok: result.ok, error: result.error, cart: result.data };
}

export async function addToCartAction(
  variantId: string,
  quantity: number,
): Promise<CartActionResult> {
  // Yalnızca-B2B modunda fiyat göremeyen ziyaretçi sepete ekleyemez.
  const pricing = await getRequestPricing();
  if (!pricing.pricesVisible) {
    return { ok: false, error: "Sipariş için bayi girişi yapmalısınız." };
  }

  return run((identity) => cartService.addItem(identity, variantId, quantity));
}

export async function updateCartQuantityAction(
  variantId: string,
  quantity: number,
  lineKey = "",
): Promise<CartActionResult> {
  return run((identity) =>
    cartService.setQuantity(identity, variantId, quantity, lineKey),
  );
}

export async function removeCartItemAction(
  variantId: string,
  lineKey = "",
): Promise<CartActionResult> {
  return run((identity) =>
    cartService.removeItem(identity, variantId, lineKey),
  );
}
