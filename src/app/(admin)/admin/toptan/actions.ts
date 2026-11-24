"use server";

import { runAdminAction, type AdminActionResult } from "@/modules/admin/action";
import { getWholesaleLeadService } from "@/modules/wholesale/container";
import type { WholesaleLeadStatus } from "@/modules/wholesale/wholesale.types";
import { PERMISSIONS } from "@/shared/permissions";

const PATHS = ["/admin/toptan", "/admin"];

export async function updateWholesaleLeadStatusAction(
  id: string,
  status: WholesaleLeadStatus,
  adminNote: string,
): Promise<AdminActionResult> {
  return runAdminAction(
    PERMISSIONS.CUSTOMER_UPDATE,
    (actor) =>
      getWholesaleLeadService().updateStatus(
        id,
        { status, adminNote },
        actor,
      ),
    PATHS,
  );
}
