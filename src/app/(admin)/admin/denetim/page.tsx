import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminMeta,
  AdminPagination,
  AdminPanel,
  AdminToolbar,
} from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getAuditQueryService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Denetim günlüğü" };

const PAGE_SIZE = 50;

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-slate-400">–</span>;
  return (
    <pre className="max-w-md overflow-x-auto rounded-lg bg-slate-50 px-2.5 py-2 text-xs whitespace-pre-wrap break-words text-slate-600 ring-1 ring-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

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

  const queryFor = (target: number) => {
    const query = new URLSearchParams();
    if (action) query.set("islem", action);
    if (entityType) query.set("varlik", entityType);
    if (target > 1) query.set("sayfa", String(target));
    const text = query.toString();
    return `/admin/denetim${text ? `?${text}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminToolbar>
        <form
          action="/admin/denetim"
          className="flex flex-1 flex-wrap items-end gap-2.5"
        >
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
            İşlem
            <Input
              name="islem"
              defaultValue={action}
              placeholder="örn. order.ship"
              aria-label="İşlem"
            />
          </label>
          <label className="flex w-48 flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Varlık
            <Select
              name="varlik"
              defaultValue={entityType}
              aria-label="Varlık"
            >
              <option value="">Tüm varlıklar</option>
              {result.entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="outline">
            Filtrele
          </Button>
        </form>
      </AdminToolbar>

      <AdminMeta>{result.total} kayıt</AdminMeta>

      <AdminPanel>
        <Table>
          <THead>
            <tr>
              <TH>Zaman</TH>
              <TH>Kullanıcı</TH>
              <TH>İşlem</TH>
              <TH>Varlık</TH>
              <TH>Önce</TH>
              <TH>Sonra</TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((row) => (
              <TR key={row.id}>
                <TD className="whitespace-nowrap text-slate-500">
                  {row.createdAt.toLocaleString("tr-TR")}
                </TD>
                <TD>
                  <div className="font-medium text-slate-800">
                    {row.actorName ?? "Sistem"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.actorEmail}
                    {row.ip ? ` · ${row.ip}` : ""}
                  </div>
                </TD>
                <TD>
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                    {row.action}
                  </code>
                </TD>
                <TD>
                  <span className="font-medium text-slate-800">
                    {row.entityType}
                  </span>
                  {row.entityId ? (
                    <div className="font-mono text-xs text-slate-500">
                      {row.entityId}
                    </div>
                  ) : null}
                </TD>
                <TD>
                  <Json value={row.before} />
                </TD>
                <TD>
                  <Json value={row.after} />
                </TD>
              </TR>
            ))}
            {result.items.length === 0 ? (
              <TR>
                <TD colSpan={6} className="p-0">
                  <AdminEmpty
                    title="Kayıt bulunamadı"
                    description="Filtreleri temizleyerek tüm denetim kayıtlarını görebilirsiniz."
                  />
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </AdminPanel>

      <AdminPagination
        page={page}
        totalPages={result.totalPages}
        hrefFor={queryFor}
      />
    </div>
  );
}

export default function AdminAuditPage({
  searchParams,
}: PageProps<"/admin/denetim">) {
  return (
    <>
      <PageHeader
        title="Denetim günlüğü"
        description="Yönetim panelinde yapılan değişikliklerin kaydı. Kayıtlar düzenlenemez."
      />
      <Suspense fallback={<AdminLoading label="Denetim kayıtları yükleniyor..." />}>
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
