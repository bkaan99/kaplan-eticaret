"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { settingsService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";

const perm = PERMISSIONS.SETTING_MANAGE;
const PATHS = ["/admin/ayarlar", "/", "/ara", "/kendi-tursunu-yap"];

export async function saveContactSettingsAction(
  payload: unknown,
): Promise<AdminActionResult> {
  const result = await runAdminAction(
    perm,
    (actor) => settingsService.saveContactSettings(payload, actor),
    PATHS,
  );

  if (result.ok) {
    try {
      revalidateTag("contact_settings", "max");
    } catch {
      // Revalidation fallback
    }
  }

  return result;
}
