import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Price } from "@/components/storefront/price";
import { features } from "@/config/features";
import { requireUser } from "@/modules/auth/session";
import { getDealerService } from "@/modules/b2b/container";
import { getOrderService } from "@/modules/orders/container";
import { ORDER_STATUS_LABELS } from "@/modules/orders/order-labels";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false },
};

async function AccountContent() {
  const user = await requireUser();
  const orders = await getOrderService().listForUser(user.id);
  const dealer = features.b2b
    ? await getDealerService().getProfile(user.id)
    : null;

  return (
    <div className="flex flex-col gap-10">
      {features.b2b ? (
        <section className="border-l-2 border-brand-gold pl-4">
          <h2 className="font-display text-xl font-semibold text-brand-dark">
            Bayilik
          </h2>
          {dealer?.status === "APPROVED" ? (
            <p className="mt-1 text-sm text-slate-600">
              Onaylı bayi
              {dealer.groupName ? ` · ${dealer.groupName}` : ""}
              {dealer.creditLimit
                ? ` · Kredi limiti: ${dealer.creditLimit} TL`
                : ""}
            </p>
          ) : dealer?.status === "PENDING" ? (
            <p className="mt-1 text-sm text-slate-500">
              Başvurunuz inceleniyor.
            </p>
          ) : (
            <Link
              href="/bayi-basvuru"
              className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Bayi başvurusu yap
            </Link>
          )}
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-slate-900/10 pb-3">
          <h2 className="font-display text-xl font-semibold text-brand-dark">
            Siparişlerim
          </h2>
          {orders.length > 0 ? (
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {orders.length} sipariş
            </span>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 max-w-sm">
            <p className="text-sm text-slate-600">
              Henüz siparişiniz yok. Kaplan ürünlerini keşfedin.
            </p>
            <Link
              href="/ara"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Alışverişe başla
            </Link>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-slate-900/10">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/siparis/${order.orderNumber}`}
                  className="group flex items-center justify-between gap-4 py-4 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-dark group-hover:text-primary">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {order.createdAt.toLocaleDateString("tr-TR")} ·{" "}
                      {ORDER_STATUS_LABELS[order.status]}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Price
                      value={order.grandTotal}
                      currency={order.currency}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}
    >
      <AccountContent />
    </Suspense>
  );
}
