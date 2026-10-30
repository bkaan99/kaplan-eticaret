import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPage } from "@/modules/admin/guard";
import { reportingService } from "@/modules/reporting/container";
import {
  REPORT_PERIODS,
  parseReportPeriod,
} from "@/modules/reporting/reporting.service";
import { cn } from "@/shared/cn";
import { PERMISSIONS } from "@/shared/permissions";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">–</span>;
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
        positive
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-rose-50 text-rose-700 border border-rose-200",
      )}
    >
      <span>{positive ? "↑" : "↓"}</span>
      <span>
        {positive ? "+" : ""}
        {value}%
      </span>
    </span>
  );
}

async function DashboardContent({
  searchParams,
}: Pick<PageProps<"/admin">, "searchParams">) {
  const user = await adminPage();
  if (!user) return <AccessDenied />;

  const canReport = user.permissions.includes(PERMISSIONS.REPORT_VIEW);
  if (!canReport) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-slate-600">
          Hoş geldiniz, <strong>{user.name || user.email}</strong>. Sol menüden çalışmak istediğiniz bölümü seçebilirsiniz.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const period = parseReportPeriod(
    typeof params["gun"] === "string" ? params["gun"] : undefined,
  );
  const data = await reportingService.dashboard(period);

  return (
    <div className="flex flex-col gap-8">
      {/* Dönem Seçimi Barı */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Genel Bakış & Metrikler</h2>
          <p className="text-xs text-slate-500">Önceki dönemle karşılaştırmalı performans verileri</p>
        </div>
        <nav aria-label="Dönem" className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          {REPORT_PERIODS.map((days) => (
            <Link
              key={days}
              href={`/admin?gun=${days}`}
              aria-current={days === period ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                days === period
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70",
              )}
            >
              Son {days} gün
            </Link>
          ))}
        </nav>
      </div>

      {/* Ana Finans & Satış Kartları */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Toplam Ciro</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 text-sm">
              ₺
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                <Price value={data.revenue.current} />
              </span>
              <Change value={data.revenue.changePercent} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Son {data.periodDays} günlük ciro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Sipariş Sayısı</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-sm">
              📦
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.orders.current} <span className="text-sm font-normal text-slate-500">adet</span>
              </span>
              <Change value={data.orders.changePercent} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Tamamlanan & aktif siparişler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Ortalama Sepet (AOV)</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-sm">
              🛒
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                <Price value={data.averageOrderValue} />
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Sipariş başına ortalama tutar</p>
          </CardContent>
        </Card>
      </div>

      {/* Müşteri İstatistikleri */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Yeni Müşteri</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 text-sm">
              👥
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.customers.newCustomers} <span className="text-sm font-normal text-slate-500">kişi</span>
              </span>
              <Change value={data.customers.newChangePercent} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Bu dönemde kayıt olanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Alışveriş Yapan Üye</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-sm">
              🛍️
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {data.customers.buyers} <span className="text-sm font-normal text-slate-500">üye</span>
            </span>
            <p className="mt-1 text-xs text-slate-400">En az 1 sipariş verenler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Tekrar Alışveriş Oranı</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-sm">
              🔄
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {data.customers.returningRate === null
                ? "—"
                : `%${data.customers.returningRate}`}
            </span>
            <p className="mt-1 text-xs text-slate-400">Sadık müşteri bağlılığı</p>
          </CardContent>
        </Card>
      </div>

      {/* Dikkat Gerektirenler (Action Items) */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900">İşlem Bekleyen Aksiyonlar</h3>
          </div>
          <span className="text-xs font-semibold text-amber-800">Acil Müdahale</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/siparisler?durum=PAID"
            className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white p-4 shadow-2xs transition hover:border-amber-400 hover:shadow-xs"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-600">Hazırlanacak Sipariş</span>
              <span className="text-xl font-bold text-slate-900">
                {data.attention.ordersToProcess}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              İncele →
            </span>
          </Link>

          <Link
            href="/admin/iadeler"
            className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white p-4 shadow-2xs transition hover:border-amber-400 hover:shadow-xs"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-600">Bekleyen İade Talebi</span>
              <span className="text-xl font-bold text-slate-900">
                {data.attention.openReturnRequests}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              İncele →
            </span>
          </Link>

          <Link
            href="/admin/bayiler"
            className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white p-4 shadow-2xs transition hover:border-amber-400 hover:shadow-xs"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-600">Onay Bekleyen Bayi</span>
              <span className="text-xl font-bold text-slate-900">
                {data.attention.pendingDealers}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              İncele →
            </span>
          </Link>
        </div>
      </div>

      {/* En Çok Satanlar ve Düşük Stok */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Çok Satanlar */}
        <Card>
          <CardHeader>
            <CardTitle>En Çok Satan Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Bu dönemde satış kaydı bulunmuyor.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100 text-sm">
                {data.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {product.quantity} adet
                      </span>
                      <span className="font-bold text-slate-900">
                        <Price value={product.revenue} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Düşük Stok */}
        <Card>
          <CardHeader>
            <CardTitle>Kritik & Düşük Stok Takibi</CardTitle>
          </CardHeader>
          <CardContent>
            {data.attention.lowStock.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Kritik seviyede stok uyarısı yok. Tüm stoklar yeterli.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100 text-sm">
                {data.attention.lowStock.map((item) => (
                  <li key={item.sku} className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{item.productName}</span>
                      <span className="text-xs text-slate-400 font-mono">SKU: {item.sku}</span>
                    </div>
                    <Badge tone={item.available === 0 ? "danger" : "warning"}>
                      {item.available} adet kaldı
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stok Talebi Bekleyenler */}
      {data.stockDemand.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Stok Talebi (Gelince Haber Ver Bekleyen Müşteriler)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-slate-100 text-sm">
              {data.stockDemand.map((item) => (
                <li key={item.sku} className="flex items-center justify-between py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <span className="text-xs text-slate-400 font-mono">SKU: {item.sku}</span>
                  </div>
                  <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700">
                    {item.waiting} müşteri bekliyor
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  return (
    <>
      <PageHeader
        title="Yönetim Paneli"
        description="Mağaza cirosu, siparişler, müşteri bağlılığı ve operasyonel özet"
      />
      <Suspense
        fallback={<AdminLoading label="İstatistikler hesaplanıyor..." />}
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
