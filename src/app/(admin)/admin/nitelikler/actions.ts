"use server";

import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { getTaxonomyService } from "@/modules/admin/container";
import { PERMISSIONS } from "@/shared/permissions";

const PATHS = ["/admin/nitelikler", "/admin/urunler"];
const perm = PERMISSIONS.CATALOG_MANAGE;

export async function saveAttributeAction(
  id: string | null,
  payload: unknown,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    async (actor) => {
      await getTaxonomyService().saveAttribute(id, payload, actor);
    },
    PATHS,
  );
}

export async function deleteAttributeAction(
  id: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => getTaxonomyService().deleteAttribute(id, actor),
    PATHS,
  );
}

export async function addAttributeValueAction(
  attributeId: string,
  value: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) =>
      getTaxonomyService().addAttributeValue(attributeId, { value }, actor),
    PATHS,
  );
}

export async function updateAttributeValueAction(
  valueId: string,
  value: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) =>
      getTaxonomyService().updateAttributeValue(valueId, { value }, actor),
    PATHS,
  );
}

export async function deleteAttributeValueAction(
  valueId: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => getTaxonomyService().deleteAttributeValue(valueId, actor),
    PATHS,
  );
}

export async function saveBrandAction(
  id: string | null,
  name: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    async (actor) => {
      await getTaxonomyService().saveBrand(id, { name }, actor);
    },
    PATHS,
  );
}

/** @deprecated Yerine `saveBrandAction(null, name)` kullanın. */
export async function createBrandAction(
  name: string,
): Promise<AdminActionResult> {
  return saveBrandAction(null, name);
}

export async function deleteBrandAction(
  id: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    perm,
    (actor) => getTaxonomyService().deleteBrand(id, actor),
    PATHS,
  );
}
