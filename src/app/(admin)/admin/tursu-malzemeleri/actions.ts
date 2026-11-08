"use server";

import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { customPickleAdminService } from "@/modules/custom-pickle/container";
import { PERMISSIONS } from "@/shared/permissions";

const PATHS = ["/admin/tursu-malzemeleri", "/kendi-tursunu-yap"];
const perm = PERMISSIONS.PRODUCT_WRITE;

export async function saveIngredientAction(
  id: string | null,
  payload: unknown,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => customPickleAdminService.saveIngredient(id, payload, actor),
    PATHS,
  );
}

export async function deleteIngredientAction(
  id: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => customPickleAdminService.deleteIngredient(id, actor),
    PATHS,
  );
}

export async function savePickleOptionsAction(
  payload: unknown,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => customPickleAdminService.saveOptions(payload, actor),
    PATHS,
  );
}
