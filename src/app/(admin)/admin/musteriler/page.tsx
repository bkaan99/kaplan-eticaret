import type { Metadata } from "next";
import Link from "next/link";
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
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCustomerQueryService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Müşteriler" };

const PAGE_SIZE = 25;

async function CustomersContent({
  searchParams,
}: Pick<PageProps<"/admin/musteriler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.CUSTOMER_READ);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const search = typeof params["q"] === "string" ? params["q"] : "";
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const result = await getCustomerQueryService().search({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const queryFor = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (target > 1) query.set("sayfa", String(target));
    const text = query.toString();
    return `/admin/musteriler${text ? `?${text}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminToolbar>
        <form
          action="/admin/musteriler"
          className="flex flex-1 flex-wrap items-end gap-2.5"
        >
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Ara
            <Input
              name="q"
              defaultValue={search}
              placeholder="Ad veya e-posta"
              aria-label="Ara"
            />
          </label>
          <Button type="submit" variant="outline">
            Ara
          </Button>
        </form>
      </AdminToolbar>

      <AdminMeta>{result.total} müşteri</AdminMeta>

      <AdminPanel>
        <Table>
          <THead>
            <tr>
              <TH>Müşteri</TH>
              <TH>Durum</TH>
              <TH>Sipariş</TH>
              <TH className="text-right">Toplam harcama</TH>
              <TH>Kayıt</TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((customer) => (
              <TR key={customer.id}>
                <TD>
                  <Link
                    href={`/admin/musteriler/${customer.id}`}
                    className="font-semibold text-slate-900 hover:text-primary"
                  >
                    {customer.name}
                  </Link>
                  <div className="text-xs text-slate-500">{customer.email}</div>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={customer.emailVerified ? "success" : "warning"}>
                      {customer.emailVerified ? "Doğrulandı" : "Doğrulanmadı"}
                    </Badge>
                    {!customer.isActive ? (
                      <Badge tone="danger">Pasif</Badge>
                    ) : null}
                  </div>
                </TD>
                <TD className="font-semibold text-slate-800">
                  {customer.orderCount}
                </TD>
                <TD className="text-right font-semibold text-slate-900">
                  <Price value={customer.totalSpent} />
                </TD>
                <TD className="text-slate-500">
                  {customer.createdAt.toLocaleDateString("tr-TR")}
                </TD>
              </TR>
            ))}
            {result.items.length === 0 ? (
              <TR>
                <TD colSpan={5} className="p-0">
                  <AdminEmpty
                    title="Müşteri bulunamadı"
                    description="Arama terimini değiştirerek tekrar deneyin."
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

export default function AdminCustomersPage({
  searchParams,
}: PageProps<"/admin/musteriler">) {
  return (
    <>
      <PageHeader
        title="Müşteriler"
        description="Kayıtlı müşterileri, doğrulama durumunu ve harcamalarını inceleyin."
      />
      <Suspense fallback={<AdminLoading label="Müşteriler yükleniyor..." />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
