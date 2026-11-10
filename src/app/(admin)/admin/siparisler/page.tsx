import { integer } from "@/shared/format";
import { AdminSearchIcon } from "@/components/admin/search-icon";
import { isOneOf } from "@/shared/guards";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  AdminPanel,
} from "@/components/admin/admin-list";
import { CsvDownloadLink } from "@/components/admin/csv-download-link";
import {
  OrderStatusBadge,
  PaymentStatusText,
  formatAdminDate,
  formatAdminTime,
  orderStatusDot,
} from "@/components/admin/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getAdminOrderService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders/order-labels";
import type { OrderStatus } from "@/modules/orders/order.types";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Siparişler" };

const PAGE_SIZE = 25;
const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

/** Sekmelerde kısa etiketler; rozetlerde tam etiket kullanılır. */
const TAB_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Ödeme bekleyen",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

const isStatus = (value: string | undefined): value is OrderStatus =>
  isOneOf(STATUSES, value);

async function OrdersContent({
  searchParams,
}: Pick<PageProps<"/admin/siparisler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.ORDER_READ);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const rawStatus =
    typeof params["durum"] === "string" ? params["durum"] : undefined;
  const status = isStatus(rawStatus) ? rawStatus : undefined;
  const search = typeof params["q"] === "string" ? params["q"].trim() : "";
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const service = getAdminOrderService();
  const [result, counts] = await Promise.all([
    service.list({ status, search, page, pageSize: PAGE_SIZE }),
    service.statusCounts(search),
  ]);
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const hrefWith = (next: { status?: OrderStatus; page?: number }) => {
    const query = new URLSearchParams();
    if (next.status) query.set("durum", next.status);
    if (search) query.set("q", search);
    if (next.page && next.page > 1) query.set("sayfa", String(next.page));
    const text = query.toString();
    return `/admin/siparisler${text ? `?${text}` : ""}`;
  };

  const tabs: { key: OrderStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "Tümü", count: allCount },
    ...STATUSES.map((value) => ({
      key: value,
      label: TAB_LABELS[value],
      count: counts[value] ?? 0,
    })),
  ];

  const first = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, result.total);

  return (
    <div className="flex flex-col gap-4">
      <AdminPanel>
        {/* Durum sekmeleri */}
        <nav
          aria-label="Sipariş durumu"
          className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2 [scrollbar-width:none]"
        >
          {tabs.map((tab) => {
            const active = (status ?? "ALL") === tab.key;
            return (
              <Link
                key={tab.key}
                href={hrefWith({
                  status: tab.key === "ALL" ? undefined : tab.key,
                })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:min-h-0",
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {tab.key !== "ALL" ? (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      orderStatusDot(tab.key),
                    )}
                  />
                ) : null}
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {integer.format(tab.count)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Arama */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <form
            action="/admin/siparisler"
            role="search"
            className="flex w-full max-w-md items-center gap-2"
          >
            {status ? (
              <input type="hidden" name="durum" value={status} />
            ) : null}
            <label className="relative flex-1">
              <span className="sr-only">Sipariş ara</span>
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                <AdminSearchIcon />
              </span>
              <input
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Sipariş no veya e-posta ara"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-9"
              />
            </label>
            <button
              type="submit"
              className="h-10 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 sm:h-9"
            >
              Ara
            </button>
            {search ? (
              <Link
                href={hrefWith({ status })}
                className="h-9 content-center px-1 text-[12px] font-medium text-slate-500 hover:text-slate-900"
              >
                Temizle
              </Link>
            ) : null}
          </form>
          <p className="text-[12px] text-slate-500 tabular-nums">
            {result.total === 0
              ? "Sonuç yok"
              : `${integer.format(result.total)} siparişten ${first}–${last} arası`}
          </p>
        </div>

        {/* Mobil: kart listesi */}
        <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
          {result.items.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/siparisler/${order.orderNumber}`}
                className="flex min-h-[4.5rem] flex-col justify-center gap-1.5 px-4 py-3.5 active:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[13px] font-semibold text-slate-900">
                    {order.orderNumber}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-slate-700">
                    {order.customerName || order.email}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-slate-900 tabular-nums">
                    {formatMoney(order.grandTotal, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                  <span>
                    {formatAdminDate(order.createdAt)}{" "}
                    {formatAdminTime(order.createdAt)} · {order.itemCount} ürün
                  </span>
                  <PaymentStatusText
                    status={order.paymentStatus}
                    className="text-[11px]"
                  />
                </div>
              </Link>
            </li>
          ))}
          {result.items.length === 0 ? (
            <li>
              <AdminEmpty
                title={
                  search ? `“${search}” için sipariş bulunamadı` : "Sipariş yok"
                }
                description="Aramayı veya durum sekmesini değiştirerek tekrar deneyin."
              />
            </li>
          ) : null}
        </ul>

        {/* Masaüstü: tablo */}
        <div className="hidden border-t border-slate-100 md:block">
          <Table>
            <THead>
              <tr>
                <TH className="pl-4">Sipariş</TH>
                <TH>Müşteri</TH>
                <TH>Durum</TH>
                <TH>Ödeme</TH>
                <TH>Tarih</TH>
                <TH className="text-right">Tutar</TH>
                <TH className="w-8 pr-4">
                  <span className="sr-only">Aç</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {result.items.map((order) => (
                <TR key={order.id} className="group relative">
                  <TD className="py-3 pl-4">
                    {/* Satırın tamamını tıklanabilir yapan bağlantı */}
                    <Link
                      href={`/admin/siparisler/${order.orderNumber}`}
                      className="font-mono text-[12.5px] font-semibold text-slate-900 after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                    >
                      {order.orderNumber}
                    </Link>
                    <div className="text-[11px] text-slate-400">
                      {order.itemCount} ürün
                    </div>
                  </TD>
                  <TD className="max-w-[16rem] py-3">
                    <div className="truncate font-medium text-slate-800">
                      {order.customerName || "—"}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {order.email}
                    </div>
                  </TD>
                  <TD className="py-3">
                    <OrderStatusBadge status={order.status} />
                  </TD>
                  <TD className="py-3">
                    <PaymentStatusText status={order.paymentStatus} />
                    {order.paymentMethod ? (
                      <div className="text-[11px] text-slate-400">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      </div>
                    ) : null}
                  </TD>
                  <TD className="py-3 whitespace-nowrap">
                    <div className="text-slate-700">
                      {formatAdminDate(order.createdAt)}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {formatAdminTime(order.createdAt)}
                    </div>
                  </TD>
                  <TD className="py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                    {formatMoney(order.grandTotal, order.currency)}
                  </TD>
                  <TD className="py-3 pr-4 text-slate-300 group-hover:text-slate-500">
                    <svg
                      viewBox="0 0 24 24"
                      width={15}
                      height={15}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </TD>
                </TR>
              ))}
              {result.items.length === 0 ? (
                <tr>
                  <TD colSpan={7} className="p-0">
                    <AdminEmpty
                      title={
                        search
                          ? `“${search}” için sipariş bulunamadı`
                          : status
                            ? `“${TAB_LABELS[status]}” durumunda sipariş yok`
                            : "Henüz sipariş yok"
                      }
                      description={
                        search || status
                          ? "Aramayı veya durum sekmesini değiştirerek tekrar deneyin."
                          : "Gelen siparişler burada listelenir."
                      }
                    />
                  </TD>
                </tr>
              ) : null}
            </TBody>
          </Table>
        </div>
      </AdminPanel>

      <AdminPagination
        page={page}
        totalPages={result.totalPages}
        hrefFor={(target) => hrefWith({ status, page: target })}
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
        description="Ödeme, hazırlık ve kargo süreçlerini buradan yönetin."
        actions={<CsvDownloadLink href="/admin/disa-aktar/siparisler" />}
      />
      <Suspense fallback={<AdminLoading label="Siparişler yükleniyor..." />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
