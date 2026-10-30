"use server";

import { getCurrentUser } from "@/modules/auth/session";
import { cartService } from "@/modules/cart/container";
import {
  getCartIdentity,
  persistCartCookie,
} from "@/modules/cart/cart.session";
import { getOrderService } from "@/modules/orders/container";
import { ReorderService } from "@/modules/orders/reorder.service";
import { runStorefrontAction } from "@/shared/action";

export interface ReorderActionResult {
  ok: boolean;
  added?: number;
  skipped?: { productName: string; reason: string }[];
  error?: string;
}

export async function reorderAction(
  orderNumber: string,
  lookupToken: string | null,
): Promise<ReorderActionResult> {
  const result = await runStorefrontAction(
    async () => {
      const user = await getCurrentUser();
      const service = new ReorderService(getOrderService(), cartService);

      const reorderResult = await service.reorder(
        orderNumber,
        { userId: user?.id ?? null, lookupToken },
        await getCartIdentity(),
      );

      await persistCartCookie({ sessionToken: reorderResult.sessionToken });
      return reorderResult;
    },
    {
      actionName: "reorder",
      context: { orderNumber },
      fallbackErrorMessage: "Ürünler sepete eklenemedi.",
      revalidate: ["/"],
    },
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    added: result.data?.added,
    skipped: result.data?.skipped,
  };
}
