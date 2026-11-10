import { integer } from "@/shared/format";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading, AdminPanel } from "@/components/admin/admin-list";
import { CustomerAvatar } from "@/components/admin/customer-avatar";
import {
  OrderStatusBadge,
  formatAdminDate,
} from "@/components/admin/order-status";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCustomerQueryService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { ORDER_STATUS_LABELS } from "@/modules/orders/order-labels";
import type { OrderStatus } from "@/modules/orders/order.types";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Müşteri" };

const B2B_LABELS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Başvuru bekliyor", tone: "bg-amber-50 text-amber-800" },
  APPROVED: { label: "Onaylı bayi", tone: "bg-emerald-50 text-emerald-800" },
  REJECTED: { label: "Başvuru reddedildi", tone: "bg-rose-50 text-rose-700" },
};

function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABELS;
}

function Section({
  title,
  action,
  children,
  flush,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <AdminPanel>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className={flush ? "" : "px-4 py-4 sm:px-5"}>{children}</div>
    </AdminPanel>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[12px] text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] text-slate-800">
        {children}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs sm:px-4 sm:py-3.5">
      <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

async function CustomerContent({
  params,
}: Pick<PageProps<"/admin/musteriler/[id]">, "params">) {
  const user = await adminPage(PERMISSIONS.CUSTOMER_READ);
  if (!user) return <AccessDenied />;

  const { id } = await params;
  const customer = await getCustomerQueryService().get(id);
  if (!customer) notFound();

  const displayName = customer.name || customer.email;
  const average =
    customer.orderCount > 0
      ? (Number(customer.totalSpent) / customer.orderCount).toFixed(2)
      : null;
  const otherOrders = customer.orders.length - customer.orderCount;
  const b2b = B2B_LABELS[customer.b2bStatus];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
        <div className="min-w-0">
          <Link
            href="/admin/musteriler"
            className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
          >
            ← Müşteriler
          </Link>
          <div className="mt-2 flex items-center gap-3.5">
            <CustomerAvatar name={displayName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                  {displayName}
                </h1>
                {!customer.isActive ? (
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">
                    Pasif hesap
                  </span>
                ) : customer.emailVerified ? (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Doğrulandı
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    Doğrulanmadı
                  </span>
                )}
                {b2b ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      b2b.tone,
                    )}
                  >
                    {b2b.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[12px] text-slate-500">
                {customer.email}
                {" · "}
                {formatAdminDate(customer.createdAt)} tarihinden beri üye
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {customer.phone ? (
            <a
              href={`tel:${customer.phone.replace(/\s/g, "")}`}
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Ara
            </a>
          ) : null}
          <a
            href={`mailto:${customer.email}`}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            E-posta gönder
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Stat
          label="Tamamlanan sipariş"
          value={integer.format(customer.orderCount)}
          hint={
            otherOrders > 0
              ? `+${otherOrders} diğer kayıtlı sipariş`
              : "İptal ve iadeler hariç"
          }
        />
        <Stat
          label="Toplam harcama"
          value={formatMoney(customer.totalSpent)}
          hint="Tamamlanan siparişlerden"
        />
        <Stat
          label="Ortalama sepet"
          value={average ? formatMoney(average) : "—"}
          hint="Sipariş başına"
        />
        <Stat
          label="Son sipariş"
          value={
            customer.lastOrderAt ? formatAdminDate(customer.lastOrderAt) : "—"
          }
          hint={customer.lastOrderAt ? undefined : "Henüz alışveriş yok"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Section
            title="Siparişler"
            flush
            action={
              customer.orders.length > 0 ? (
                <span className="text-[12px] text-slate-500">
                  {customer.orders.length === 50
                    ? "Son 50 sipariş"
                    : `${customer.orders.length} sipariş`}
                </span>
              ) : null
            }
          >
            {customer.orders.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-slate-400">
                Bu müşteri henüz sipariş vermedi.
              </p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH className="pl-5">Sipariş</TH>
                    <TH className="hidden sm:table-cell">Tarih</TH>
                    <TH>Durum</TH>
                    <TH className="pr-5 text-right">Tutar</TH>
                  </tr>
                </THead>
                <TBody>
                  {customer.orders.map((order) => (
                    <TR key={order.orderNumber} className="group relative">
                      <TD className="py-2.5 pl-5">
                        <Link
                          href={`/admin/siparisler/${order.orderNumber}`}
                          className="font-mono text-[12.5px] font-semibold text-slate-900 after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                        <div className="text-[11px] text-slate-400 sm:hidden">
                          {formatAdminDate(order.createdAt)}
                        </div>
                      </TD>
                      <TD className="hidden py-2.5 whitespace-nowrap text-slate-600 sm:table-cell">
                        {formatAdminDate(order.createdAt)}
                      </TD>
                      <TD className="py-2.5">
                        {isOrderStatus(order.status) ? (
                          <OrderStatusBadge status={order.status} />
                        ) : (
                          order.status
                        )}
                      </TD>
                      <TD className="py-2.5 pr-5 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                        {formatMoney(order.grandTotal)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Section title="İletişim">
            <dl className="-my-1.5">
              <Row label="E-posta">
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:text-slate-900 hover:underline"
                >
                  {customer.email}
                </a>
              </Row>
              <Row label="Telefon">
                {customer.phone ? (
                  <a
                    href={`tel:${customer.phone.replace(/\s/g, "")}`}
                    className="tabular-nums hover:text-slate-900 hover:underline"
                  >
                    {customer.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </Row>
              <Row label="E-posta doğrulama">
                {customer.emailVerified ? (
                  <span className="text-emerald-700">Doğrulandı</span>
                ) : (
                  <span className="text-amber-700">Doğrulanmadı</span>
                )}
              </Row>
              <Row label="Hesap">
                {customer.isActive ? (
                  "Aktif"
                ) : (
                  <span className="text-rose-700">Pasif</span>
                )}
              </Row>
            </dl>
          </Section>

          {b2b ? (
            <Section
              title="Bayi bilgileri"
              action={
                <Link
                  href="/admin/bayiler"
                  className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
                >
                  Bayiler →
                </Link>
              }
            >
              <dl className="-my-1.5">
                <Row label="Durum">{b2b.label}</Row>
                <Row label="Firma">{customer.companyName ?? "—"}</Row>
                <Row label="Fiyat grubu">{customer.groupName ?? "—"}</Row>
              </dl>
            </Section>
          ) : null}

          <Section title="Kayıtlı adresler">
            {customer.addresses.length === 0 ? (
              <p className="text-[12px] text-slate-500">Kayıtlı adres yok.</p>
            ) : (
              <ul className="-my-1 divide-y divide-slate-100">
                {customer.addresses.map((item) => (
                  <li key={item.id} className="py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-medium text-slate-900">
                        {item.title}
                      </span>
                      {item.isDefaultShipping ? (
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">
                          Varsayılan teslimat
                        </span>
                      ) : null}
                      {item.isDefaultBilling ? (
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">
                          Varsayılan fatura
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                      {item.name}
                      {item.companyName ? ` · ${item.companyName}` : ""}
                      <br />
                      {item.line}
                      <br />
                      {item.district} / {item.city} ·{" "}
                      <span className="tabular-nums">{item.phone}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomerPage({
  params,
}: PageProps<"/admin/musteriler/[id]">) {
  return (
    <Suspense fallback={<AdminLoading label="Müşteri yükleniyor..." />}>
      <CustomerContent params={params} />
    </Suspense>
  );
}
