import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading, AdminPanel } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerQueryService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { ORDER_STATUS_LABELS } from "@/modules/orders/order-labels";
import type { OrderStatus } from "@/modules/orders/order.types";
import { PERMISSIONS } from "@/shared/permissions";

export const metadata: Metadata = { title: "Müşteri" };

async function CustomerContent({
  params,
}: Pick<PageProps<"/admin/musteriler/[id]">, "params">) {
  const user = await adminPage(PERMISSIONS.CUSTOMER_READ);
  if (!user) return <AccessDenied />;

  const { id } = await params;
  const customer = await getCustomerQueryService().get(id);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.name}
        description={customer.email}
        actions={
          <Link
            href="/admin/musteriler"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            ← Müşteriler
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sipariş</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tracking-tight text-slate-900">
            {customer.orderCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Toplam harcama</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tracking-tight text-slate-900">
            <Price value={customer.totalSpent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 text-sm">
            <Badge tone={customer.emailVerified ? "success" : "warning"}>
              {customer.emailVerified
                ? "E-posta doğrulandı"
                : "E-posta doğrulanmadı"}
            </Badge>
            {customer.b2bStatus !== "NONE" ? (
              <Badge tone="info">Bayi: {customer.b2bStatus}</Badge>
            ) : null}
            {customer.groupName ? <Badge>{customer.groupName}</Badge> : null}
          </CardContent>
        </Card>
      </div>

      <AdminPanel>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Siparişler</h2>
        </div>
        {customer.orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Sipariş yok.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 text-sm">
            {customer.orders.map((order) => (
              <li
                key={order.orderNumber}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <Link
                  href={`/admin/siparisler/${order.orderNumber}`}
                  className="font-semibold text-slate-900 hover:text-primary"
                >
                  {order.orderNumber}
                </Link>
                <span className="text-slate-500">
                  {order.createdAt.toLocaleDateString("tr-TR")} ·{" "}
                  {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                </span>
                <span className="font-bold text-slate-900">
                  <Price value={order.grandTotal} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
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
