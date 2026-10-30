import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getAuditQueryService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { AuditLogViewer } from "./audit-log-viewer";

export const metadata: Metadata = { title: "Denetim Günlüğü" };

const PAGE_SIZE = 50;

async function AuditContent({
  searchParams,
}: Pick<PageProps<"/admin/denetim">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.AUDIT_VIEW);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const action = typeof params["islem"] === "string" ? params["islem"] : "";
  const entityType =
    typeof params["varlik"] === "string" ? params["varlik"] : "";
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const result = await getAuditQueryService().search({
    action: action || undefined,
    entityType: entityType || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <AuditLogViewer
      items={result.items.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        actorName: row.actorName,
        actorEmail: row.actorEmail,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        before: row.before,
        after: row.after,
        ip: row.ip,
      }))}
      total={result.total}
      page={page}
      totalPages={result.totalPages}
      entityTypes={result.entityTypes}
      currentAction={action}
      currentEntityType={entityType}
    />
  );
}

export default function AdminAuditPage({
  searchParams,
}: PageProps<"/admin/denetim">) {
  return (
    <>
      <PageHeader
        title="Denetim Günlüğü"
        description="Yönetim panelinde yapılan tüm değişiklikler, güvenlik olayları ve eylem geçmişi."
      />
      <Suspense
        fallback={<AdminLoading label="Denetim kayıtları yükleniyor..." />}
      >
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
