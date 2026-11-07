"use server";

import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { getPaymentModeService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";

/** Ödeme modunu değiştirir (test / PayTR test / canlı). Yetki ve denetim kaydı serviste. */
export async function savePaymentModeAction(
  mode: unknown,
): Promise<AdminActionResult> {
  return runAdminAction(
    PERMISSIONS.SETTING_MANAGE,
    async (actor) => {
      await getPaymentModeService().setMode(mode, actor);
    },
    ["/admin/odeme", "/odeme"],
  );
}
