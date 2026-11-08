import { AdminSearchIcon } from "@/components/admin/search-icon";
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
import { CustomerAvatar } from "@/components/admin/customer-avatar";
import { formatAdminDate } from "@/components/admin/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCustomerQueryService } from "@/modules/admin/container";
import {
  CUSTOMER_SEGMENTS,
  type CustomerRow,
  type CustomerSegment,
} from "@/modules/admin/customers/customer-query";
import { adminPage } from "@/modules/admin/guard";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Müşteriler" };

const PAGE_SIZE = 25;
const integer = new Intl.NumberFormat("tr-TR");

/** URL'deki değer → segment ("?segment=alici" gibi Türkçe kısa adlar). */
const SEGMENT_PARAM: Record<CustomerSegment, string> = {
  all: "",
  buyers: "alici",
  "no-orders": "siparissiz",
  unverified: "dogrulanmamis",
};
const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  all: "Tümü",
  buyers: "Alışveriş yapan",
  "no-orders": "Henüz sipariş yok",
  unverified: "Doğrulanmamış",
};

function parseSegment(value: string | undefined): CustomerSegment {
  return (
    CUSTOMER_SEGMENTS.find((s) => SEGMENT_PARAM[s] === value && value) ?? "all"
  );
}

function AccountStatus({ customer }: { customer: CustomerRow }) {
  if (!customer.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Pasif hesap
      </span>
    );
  }
  return customer.emailVerified ? (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Doğrulandı
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Doğrulanmadı
    </span>
  );
}

async function CustomersContent({
  searchParams,
}: Pick<PageProps<"/admin/musteriler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.CUSTOMER_READ);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const search = typeof params["q"] === "string" ? params["q"].trim() : "";
  const segment = parseSegment(
    typeof params["segment"] === "string" ? params["segment"] : undefined,
  );
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const service = getCustomerQueryService();
  const [result, counts] = await Promise.all([
    service.search({ search, segment, page, pageSize: PAGE_SIZE }),
    service.segmentCounts(search),
  ]);

  const hrefWith = (next: { segment?: CustomerSegment; page?: number }) => {
    const query = new URLSearchParams();
    const value = SEGMENT_PARAM[next.segment ?? "all"];
    if (value) query.set("segment", value);
    if (search) query.set("q", search);
    if (next.page && next.page > 1) query.set("sayfa", String(next.page));
    const text = query.toString();
    return `/admin/musteriler${text ? `?${text}` : ""}`;
  };

  const first = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, result.total);
  const emptyTitle = search
    ? `“${search}” için müşteri bulunamadı`
    : segment === "all"
      ? "Henüz kayıtlı müşteri yok"
      : `“${SEGMENT_LABELS[segment]}” segmentinde müşteri yok`;

  return (
    <div className="flex flex-col gap-4">
      <AdminPanel>
        <nav
          aria-label="Müşteri segmenti"
          className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2 [scrollbar-width:none]"
        >
          {CUSTOMER_SEGMENTS.map((key) => {
            const active = segment === key;
            return (
              <Link
                key={key}
                href={hrefWith({ segment: key })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {SEGMENT_LABELS[key]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {integer.format(counts[key])}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <form
            action="/admin/musteriler"
            role="search"
            className="flex w-full max-w-md items-center gap-2"
          >
            {SEGMENT_PARAM[segment] ? (
              <input
                type="hidden"
                name="segment"
                value={SEGMENT_PARAM[segment]}
              />
            ) : null}
            <label className="relative flex-1">
              <span className="sr-only">Müşteri ara</span>
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                <AdminSearchIcon />
              </span>
              <input
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Ad, soyad veya e-posta ara"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
            >
              Ara
            </button>
            {search ? (
              <Link
                href={hrefWith({ segment })}
                className="h-9 content-center px-1 text-[12px] font-medium text-slate-500 hover:text-slate-900"
              >
                Temizle
              </Link>
            ) : null}
          </form>
          <p className="text-[12px] text-slate-500 tabular-nums">
            {result.total === 0
              ? "Sonuç yok"
              : `${integer.format(result.total)} müşteriden ${first}–${last} arası`}
          </p>
        </div>

        {/* Mobil: kart listesi */}
        <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
          {result.items.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/admin/musteriler/${customer.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-slate-50"
              >
                <CustomerAvatar name={customer.name || customer.email} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-slate-900">
                      {customer.name || "—"}
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-slate-900 tabular-nums">
                      {formatMoney(customer.totalSpent)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="truncate">{customer.email}</span>
                    <span className="shrink-0">
                      {customer.orderCount} sipariş
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {result.items.length === 0 ? (
            <li>
              <AdminEmpty
                title={emptyTitle}
                description="Aramayı veya segmenti değiştirerek tekrar deneyin."
              />
            </li>
          ) : null}
        </ul>

        {/* Masaüstü: tablo */}
        <div className="hidden border-t border-slate-100 md:block">
          <Table>
            <THead>
              <tr>
                <TH className="pl-4">Müşteri</TH>
                <TH>Hesap</TH>
                <TH className="text-right">Sipariş</TH>
                <TH className="text-right">Toplam harcama</TH>
                <TH>Son sipariş</TH>
                <TH className="hidden lg:table-cell">Kayıt</TH>
                <TH className="w-8 pr-4">
                  <span className="sr-only">Aç</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {result.items.map((customer) => (
                <TR key={customer.id} className="group relative">
                  <TD className="py-2.5 pl-4">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar name={customer.name || customer.email} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/musteriler/${customer.id}`}
                          className="block max-w-[18rem] truncate font-medium text-slate-900 after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                        >
                          {customer.name || "—"}
                        </Link>
                        <span className="block max-w-[18rem] truncate text-[11px] text-slate-500">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </TD>
                  <TD className="py-2.5">
                    <AccountStatus customer={customer} />
                  </TD>
                  <TD className="py-2.5 text-right text-slate-700 tabular-nums">
                    {customer.orderCount === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      integer.format(customer.orderCount)
                    )}
                  </TD>
                  <TD className="py-2.5 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                    {customer.orderCount === 0 ? (
                      <span className="font-normal text-slate-400">—</span>
                    ) : (
                      formatMoney(customer.totalSpent)
                    )}
                  </TD>
                  <TD className="py-2.5 whitespace-nowrap text-slate-600">
                    {customer.lastOrderAt ? (
                      formatAdminDate(customer.lastOrderAt)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TD>
                  <TD className="hidden py-2.5 text-[12px] whitespace-nowrap text-slate-400 lg:table-cell">
                    {formatAdminDate(customer.createdAt)}
                  </TD>
                  <TD className="py-2.5 pr-4 text-slate-300 group-hover:text-slate-500">
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
                      title={emptyTitle}
                      description="Aramayı veya segmenti değiştirerek tekrar deneyin."
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
        hrefFor={(target) => hrefWith({ segment, page: target })}
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
        description="Kayıtlı üyeleri, alışveriş geçmişlerini ve hesap durumlarını inceleyin."
      />
      <Suspense fallback={<AdminLoading label="Müşteriler yükleniyor..." />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
