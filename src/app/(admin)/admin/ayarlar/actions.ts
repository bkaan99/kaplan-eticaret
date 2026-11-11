"use server";

import { revalidateTag } from "next/cache";
import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { settingsService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";

const perm = PERMISSIONS.SETTING_MANAGE;
const CONTACT_PATHS = ["/admin/ayarlar", "/", "/ara", "/kendi-tursunu-yap", "/iletisim"];
const SHIPPING_PATHS = [
  "/admin/ayarlar",
  "/",
  "/ara",
  "/sepet",
  "/odeme",
  "/urun",
  "/feeds/products.xml",
];

export async function saveContactSettingsAction(
  payload: unknown,
): Promise<AdminActionResult> {
  const result = await runAdminAction(
    perm,
    (actor) => settingsService.saveContactSettings(payload, actor),
    CONTACT_PATHS,
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

export async function saveShippingSettingsAction(
  payload: unknown,
): Promise<AdminActionResult> {
  const result = await runAdminAction(
    perm,
    (actor) => settingsService.saveShippingSettings(payload, actor),
    SHIPPING_PATHS,
  );

  if (result.ok) {
    try {
      revalidateTag("shipping_settings", "max");
      revalidateTag("settings", "max");
    } catch {
      // Revalidation fallback
    }
  }

  return result;
}
