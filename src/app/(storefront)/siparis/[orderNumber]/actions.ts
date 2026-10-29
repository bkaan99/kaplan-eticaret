"use server";

import { getCurrentUser } from "@/modules/auth/session";
import { getOrderService } from "@/modules/orders/container";
import { runStorefrontAction } from "@/shared/action";

export interface CancelOrderResult {
  ok: boolean;
  error?: string;
}

export async function cancelOrderAction(
  orderNumber: string,
  lookupToken: string | null,
): Promise<CancelOrderResult> {
  return runStorefrontAction(
    async () => {
      const user = await getCurrentUser();
      await getOrderService().cancel(orderNumber, {
        userId: user?.id ?? null,
        lookupToken,
      });
    },
    {
      actionName: "cancelOrder",
      context: { orderNumber },
      fallbackErrorMessage: "İptal işlemi tamamlanamadı.",
      revalidate: [`/siparis/${orderNumber}`],
    },
  );
}
