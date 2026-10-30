"use server";

import { getCurrentUser } from "@/modules/auth/session";
import { getReturnService } from "@/modules/returns/container";
import { runStorefrontAction } from "@/shared/action";
import {
  RATE_LIMIT_POLICIES,
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";

export interface ReturnRequestResult {
  ok: boolean;
  error?: string;
}

export async function requestReturnAction(
  orderNumber: string,
  lookupToken: string | null,
  payload: {
    items: { orderItemId: string; quantity: number }[];
    reason: string;
    note: string;
  },
): Promise<ReturnRequestResult> {
  return runStorefrontAction(
    async () => {
      const ip = await getClientIp();
      await enforceRateLimit("return-request", ip, RATE_LIMIT_POLICIES.checkout);

      const user = await getCurrentUser();
      await getReturnService().request(
        orderNumber,
        { userId: user?.id ?? null, lookupToken },
        {
          items: payload.items,
          reason: payload.reason,
          note: payload.note || null,
        },
      );
    },
    {
      actionName: "requestReturn",
      context: { orderNumber },
      fallbackErrorMessage: "Talep oluşturulamadı, lütfen tekrar deneyin.",
      revalidate: [`/siparis/${orderNumber}`],
    },
  );
}
