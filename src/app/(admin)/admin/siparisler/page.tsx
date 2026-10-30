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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getAdminOrderService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
} from "@/modules/orders/order-labels";
import type { OrderStatus, PaymentStatus } from "@/modules/orders/order.types";
import { cn } from "@/shared/cn";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Siparişler" };

const PAGE_SIZE = 25;
const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function isStatus(value: string | undefined): value is OrderStatus {
  return STATUSES.includes(value as OrderStatus);
}

async function OrdersContent({
  searchParams,
}: Pick<PageProps<"/admin/siparisler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.ORDER_READ);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const rawStatus =
    typeof params["durum"] === "string" ? params["durum"] : undefined;
  const search = typeof params["q"] === "string" ? params["q"] : "";
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const result = await getAdminOrderService().list({
    status: isStatus(rawStatus) ? rawStatus : undefined,
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const queryFor = (target: number) => {
    const query = new URLSearchParams();
    if (isStatus(rawStatus)) query.set("durum", rawStatus);
    if (search) query.set("q", search);
    if (target > 1) query.set("sayfa", String(target));
    const text = query.toString();
    return `/admin/siparisler${text ? `?${text}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminToolbar>
        <form
          className="flex flex-1 flex-wrap items-end gap-2.5"
          action="/admin/siparisler"
        >
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Ara
            <Input
              name="q"
              defaultValue={search}
              placeholder="Sipariş no veya e-posta"
              aria-label="Ara"
            />
          </label>
          <label className="flex w-44 flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Durum
            <Select
              name="durum"
              defaultValue={rawStatus ?? ""}
              aria-label="Durum"
            >
              <option value="">Tüm durumlar</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="outline">
            Filtrele
          </Button>
        </form>
      </AdminToolbar>

      <div className="flex items-center justify-between gap-3">
        <AdminMeta>{result.total} sipariş</AdminMeta>
      </div>

      <AdminPanel>
        <Table>
          <THead>
            <tr>
              <TH>Sipariş</TH>
              <TH>Müşteri</TH>
              <TH>Durum</TH>
              <TH>Ödeme</TH>
              <TH>Adet</TH>
              <TH className="text-right">Tutar</TH>
              <TH>Tarih</TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((order) => (
              <TR key={order.id}>
                <TD>
                  <Link
                    href={`/admin/siparisler/${order.orderNumber}`}
                    className="font-semibold text-slate-900 hover:text-primary"
                  >
                    {order.orderNumber}
                  </Link>
                </TD>
                <TD>
                  <div className="font-medium text-slate-800">
                    {order.customerName}
                  </div>
                  <div className="text-xs text-slate-500">{order.email}</div>
                </TD>
                <TD>
                  <Badge tone={ORDER_STATUS_TONES[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </TD>
                <TD className="text-sm">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]}
                </TD>
                <TD>{order.itemCount}</TD>
                <TD className="text-right font-semibold text-slate-900">
                  <Price value={order.grandTotal} currency={order.currency} />
                </TD>
                <TD className="whitespace-nowrap text-slate-500">
                  {order.createdAt.toLocaleString("tr-TR")}
                </TD>
              </TR>
            ))}
            {result.items.length === 0 ? (
              <TR>
                <TD colSpan={7} className="p-0">
                  <AdminEmpty
                    title="Sipariş bulunamadı"
                    description="Arama veya durum filtresini değiştirerek tekrar deneyin."
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

export default function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/siparisler">) {
  return (
    <>
      <PageHeader
        title="Siparişler"
        description="Ödeme, hazırlık ve kargo durumlarını buradan yönetin."
        actions={
          <a
            href="/admin/disa-aktar/siparisler"
            className={cn(buttonVariants({ variant: "outline" }))}
            download
          >
            CSV indir
          </a>
        }
      />
      <Suspense fallback={<AdminLoading label="Siparişler yükleniyor..." />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
