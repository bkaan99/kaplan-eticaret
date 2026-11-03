import { connection } from "next/server";
import { getAuditLogger } from "@/shared/audit";
import { getExportService } from "@/modules/admin/container";
import { requirePermission } from "@/modules/auth/session";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS } from "@/shared/permissions";
import { getClientIp } from "@/shared/rate-limit";

const TYPES = ["siparisler", "urunler"] as const;

/** Siparişleri veya ürünleri CSV olarak indirir; yetki ve denetim kaydı zorunludur. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> },
) {
  await connection();
  const { type } = await context.params;

  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return new Response("Bulunamadı", { status: 404 });
  }

  try {
    const user = await requirePermission(PERMISSIONS.EXPORT_RUN);
    const service = getExportService();
    const csv =
      type === "siparisler"
        ? await service.ordersCsv()
        : await service.productsCsv();

    await getAuditLogger().log({
      actorId: user.id,
      ip: await getClientIp(),
      action: `export.${type}`,
      entityType: "Export",
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.httpStatus === 403) {
      return new Response("Yetkiniz yok", { status: 403 });
    }
    throw error;
  }
}
