import Link from "next/link";
import type { ReactNode } from "react";
import {
  OrderStatusBadge,
  PaymentStatusText,
  formatAdminDate,
  formatAdminTime,
} from "@/components/admin/order-status";
import { Card } from "@/components/ui/card";
import type { AdminOrderDetail } from "@/modules/admin/orders/admin-order.repository";
import {
  PAYMENT_METHOD_LABELS,
  RETURN_STATUS_LABELS,
} from "@/modules/orders/order-labels";
import { formatMoney } from "@/shared/money";
import { trackingUrl } from "@/shared/shipping/carriers";
import { OrderProgress } from "./order-progress";

type Address = Record<string, string | null>;

interface PickleRecipe {
  kind?: string;
  ingredients?: { name: string; share?: number }[];
  brine?: string;
  spice?: string;
  note?: string | null;
}

function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  );
}

/** Etiket–değer satırı (sağ sütundaki bilgi kartlarında). */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[12px] text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] text-slate-800">
        {children}
      </dd>
    </div>
  );
}

function sameAddress(a: Address, b: Address): boolean {
  const keys = ["firstName", "lastName", "addressLine", "district", "city"];
  return keys.every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

function AddressLines({ address }: { address: Address }) {
  return (
    <address className="flex flex-col gap-0.5 text-[13px] leading-relaxed text-slate-700 not-italic">
      <span className="font-medium text-slate-900">
        {address["firstName"]} {address["lastName"]}
      </span>
      <span>
        {address["addressLine"]}
        {address["neighborhood"] ? `, ${address["neighborhood"]}` : ""}
      </span>
      <span>
        {address["district"]} / {address["city"]}
        {address["postalCode"] ? ` · ${address["postalCode"]}` : ""}
      </span>
      {address["phone"] ? (
        <a
          href={`tel:${address["phone"].replace(/\s/g, "")}`}
          className="text-slate-600 tabular-nums hover:text-slate-900 hover:underline"
        >
          {address["phone"]}
        </a>
      ) : null}
      {address["companyName"] ? (
        <span className="mt-1 text-[12px] text-slate-500">
          {address["companyName"]} · VKN {address["taxNumber"]} (
          {address["taxOffice"]})
        </span>
      ) : address["nationalId"] ? (
        <span className="mt-1 font-mono text-[11px] text-slate-500">
          TCKN {address["nationalId"]}
        </span>
      ) : null}
    </address>
  );
}

export function OrderDetailView({
  order,
  actions,
}: {
  order: AdminOrderDetail;
  /** İşlem paneli (yetki varsa); yoksa bölüm gösterilmez */
  actions?: ReactNode;
}) {
  const payment = order.payments[0];
  const shipment = order.shipments[0];
  const discount = Number(order.discountTotal) > 0;
  const shippingIsSame = sameAddress(
    order.shippingAddress,
    order.billingAddress,
  );
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totals: { label: string; value: string; strong?: boolean }[] = [
    {
      label: `Ara toplam (${itemCount} ürün)`,
      value: formatMoney(order.subtotal, order.currency),
    },
    ...(discount
      ? [
          {
            label: `İndirim${order.couponCode ? ` · ${order.couponCode}` : ""}`,
            value: `−${formatMoney(order.discountTotal, order.currency)}`,
          },
        ]
      : []),
    {
      label: "Kargo",
      value:
        Number(order.shippingTotal) === 0
          ? "Ücretsiz"
          : formatMoney(order.shippingTotal, order.currency),
    },
    {
      label: "Toplam",
      value: formatMoney(order.grandTotal, order.currency),
      strong: true,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Başlık şeridi */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
        <div className="min-w-0">
          <Link
            href="/admin/siparisler"
            className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
          >
            ← Siparişler
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-xl font-semibold tracking-tight text-slate-900">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-[12px] text-slate-500">
            {formatAdminDate(order.createdAt)}{" "}
            {formatAdminTime(order.createdAt)} ·{" "}
            {order.userId ? "Üye siparişi" : "Misafir siparişi"} · Kanal:{" "}
            {order.source}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Sipariş tutarı</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">
            {formatMoney(order.grandTotal, order.currency)}
          </p>
        </div>
      </div>

      <Card className="px-5 py-5">
        <OrderProgress
          status={order.status}
          dates={{
            PLACED: order.createdAt,
            PAID: payment?.paidAt ?? null,
            SHIPPED: shipment?.shippedAt ?? null,
          }}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sol: işlemler + ürünler */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {actions ? <Section title="İşlemler">{actions}</Section> : null}

          <Section title="Ürünler">
            <ul className="-my-1 divide-y divide-slate-100">
              {order.items.map((item) => {
                const recipe = item.customization as PickleRecipe | undefined;
                const isPickle = recipe?.kind === "custom-pickle";
                return (
                  <li key={item.id ?? item.sku} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900">
                          {item.productName}
                          {isPickle ? (
                            <span className="ml-2 rounded-md bg-emerald-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-emerald-800">
                              Özel reçete
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {item.variantName ? `${item.variantName} · ` : ""}
                          <span className="font-mono text-[11px]">
                            {item.sku}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-medium text-slate-900 tabular-nums">
                          {formatMoney(item.lineTotal, order.currency)}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {item.quantity} ×{" "}
                          {formatMoney(item.unitPrice, order.currency)}
                        </p>
                      </div>
                    </div>
                    {isPickle ? (
                      <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-[12px] sm:grid-cols-[auto_1fr]">
                        <dt className="text-slate-500">Malzemeler</dt>
                        <dd className="text-slate-800">
                          {recipe.ingredients
                            ?.map((i) =>
                              i.share === undefined
                                ? i.name
                                : `${i.name} %${i.share}`,
                            )
                            .join(", ") || "—"}
                        </dd>
                        <dt className="text-slate-500">Salamura</dt>
                        <dd className="text-slate-800">
                          {recipe.brine || "—"}
                        </dd>
                        <dt className="text-slate-500">Acılık</dt>
                        <dd className="text-slate-800">
                          {recipe.spice || "—"}
                        </dd>
                        {recipe.note ? (
                          <>
                            <dt className="text-slate-500">Not</dt>
                            <dd className="text-slate-800 italic">
                              {recipe.note}
                            </dd>
                          </>
                        ) : null}
                      </dl>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <dl className="mt-3 ml-auto flex max-w-xs flex-col border-t border-slate-100 pt-3">
              {totals.map((line) => (
                <div
                  key={line.label}
                  className={
                    line.strong
                      ? "mt-1.5 flex justify-between border-t border-slate-100 pt-2.5 text-[14px] font-semibold text-slate-900"
                      : "flex justify-between py-0.5 text-[13px] text-slate-600"
                  }
                >
                  <dt>{line.label}</dt>
                  <dd className="tabular-nums">{line.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        {/* Sağ: müşteri, adres, ödeme, kargo */}
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Müşteri">
            <p className="text-[13px] font-medium text-slate-900">
              {`${order.shippingAddress["firstName"] ?? ""} ${order.shippingAddress["lastName"] ?? ""}`.trim() ||
                "—"}
            </p>
            <a
              href={`mailto:${order.email}`}
              className="mt-0.5 block truncate text-[13px] text-slate-600 hover:text-slate-900 hover:underline"
            >
              {order.email}
            </a>
            <p className="mt-1 text-[11px] text-slate-400">
              {order.userId ? "Kayıtlı üye" : "Misafir alışverişi"}
            </p>
            {order.customerNote ? (
              <div className="mt-3 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-[12px] text-amber-900">
                <span className="font-semibold">Müşteri notu: </span>
                {order.customerNote}
              </div>
            ) : null}
          </Section>

          <Section title="Teslimat adresi">
            <AddressLines address={order.shippingAddress} />
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                Fatura adresi
              </p>
              {shippingIsSame ? (
                <p className="mt-1 text-[12px] text-slate-500">
                  Teslimat adresiyle aynı
                  {order.billingAddress["companyName"]
                    ? ` · ${order.billingAddress["companyName"]}`
                    : ""}
                </p>
              ) : (
                <div className="mt-1">
                  <AddressLines address={order.billingAddress} />
                </div>
              )}
            </div>
          </Section>

          <Section title="Ödeme">
            {order.payments.length === 0 ? (
              <p className="text-[12px] text-slate-500">Ödeme kaydı yok.</p>
            ) : (
              order.payments.map((item) => (
                <dl key={item.merchantOid} className="-my-1.5">
                  <Row label="Yöntem">{PAYMENT_METHOD_LABELS[item.method]}</Row>
                  <Row label="Durum">
                    <PaymentStatusText status={item.status} />
                  </Row>
                  <Row label="Tutar">
                    <span className="font-medium tabular-nums">
                      {formatMoney(item.amount, order.currency)}
                    </span>
                  </Row>
                  {item.paidAt ? (
                    <Row label="Ödeme tarihi">
                      {formatAdminDate(item.paidAt)}{" "}
                      {formatAdminTime(item.paidAt)}
                    </Row>
                  ) : null}
                  {item.dueAt ? (
                    <Row label="Vade">{formatAdminDate(item.dueAt)}</Row>
                  ) : null}
                  <Row label="İşlem no">
                    <span className="font-mono text-[11px] break-all text-slate-500">
                      {item.merchantOid}
                    </span>
                  </Row>
                </dl>
              ))
            )}
          </Section>

          <Section title="Kargo">
            {order.shipments.length === 0 ? (
              <p className="text-[12px] text-slate-500">
                Henüz kargoya verilmedi.
              </p>
            ) : (
              order.shipments.map((item, index) => {
                const link = trackingUrl(item.carrier, item.trackingNumber);
                return (
                  <dl key={index} className="-my-1.5">
                    <Row label="Firma">{item.carrier}</Row>
                    <Row label="Takip no">
                      {item.trackingNumber ? (
                        <span className="font-mono text-[12px]">
                          {item.trackingNumber}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Row>
                    {item.shippedAt ? (
                      <Row label="Gönderim">
                        {formatAdminDate(item.shippedAt)}
                      </Row>
                    ) : null}
                    {link ? (
                      <Row label="Takip">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          Kargoyu takip et ↗
                        </a>
                      </Row>
                    ) : null}
                  </dl>
                );
              })
            )}
          </Section>

          {order.returns.length > 0 ? (
            <Section
              title="İade talepleri"
              action={
                <Link
                  href="/admin/iadeler"
                  className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
                >
                  İadeler →
                </Link>
              }
            >
              <ul className="-my-1 divide-y divide-slate-100">
                {order.returns.map((request) => (
                  <li key={request.id} className="py-2">
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-medium text-slate-800">
                        {formatAdminDate(request.createdAt)}
                      </span>
                      <span className="text-[12px] font-medium text-slate-600">
                        {RETURN_STATUS_LABELS[request.status] ?? request.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {request.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
