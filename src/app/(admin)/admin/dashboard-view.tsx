import { integer } from "@/shared/format";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/revenue-chart";
import {
  REPORT_PERIODS,
  type DashboardData,
} from "@/modules/reporting/reporting.service";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { AdminQuickLinks } from "@/components/admin/admin-list";
import { EmptyState, Kpi, Panel, PanelLink, icons } from "./dashboard-parts";

export function PeriodSwitcher({ period }: { period: number }) {
  return (
    <nav
      aria-label="Rapor dönemi"
      className="inline-flex w-full items-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs [scrollbar-width:none] sm:w-auto"
    >
      {REPORT_PERIODS.map((days) => (
        <Link
          key={days}
          href={`/admin?gun=${days}`}
          aria-current={days === period ? "page" : undefined}
          className={cn(
            "min-h-10 flex-1 rounded-md px-3 py-2 text-center text-[12px] font-medium whitespace-nowrap transition-colors sm:min-h-0 sm:flex-none sm:py-1.5",
            days === period
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          {days === 365 ? "1 yıl" : `${days} gün`}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  const previousAov =
    data.orders.previous === 0
      ? null
      : Number(data.revenue.previous) / data.orders.previous;
  const aovChange =
    previousAov === null || previousAov === 0
      ? null
      : Math.round(
          ((Number(data.averageOrderValue) - previousAov) / previousAov) * 1000,
        ) / 10;

  const tasks = [
    {
      href: "/admin/siparisler?durum=PAID",
      label: "Hazırlanacak sipariş",
      hint: "Ödemesi alınmış, kargoya verilmemiş",
      icon: icons.package,
      count: data.attention.ordersToProcess,
    },
    {
      href: "/admin/iadeler",
      label: "Bekleyen iade talebi",
      hint: "Onay ya da red bekliyor",
      icon: icons.returns,
      count: data.attention.openReturnRequests,
    },
    {
      href: "/admin/bayiler?durum=PENDING",
      label: "Onay bekleyen bayi",
      hint: "Başvuru incelemesi",
      icon: icons.dealer,
      count: data.attention.pendingDealers,
    },
    {
      href: "/admin/urunler",
      label: "Kritik stok",
      hint: "Eşiğin altındaki varyantlar",
      icon: icons.alert,
      count: data.attention.lowStock.length,
    },
  ];
  const openTasks = tasks.reduce((sum, task) => sum + task.count, 0);
  const topMax = Math.max(1, ...data.topProducts.map((p) => p.quantity));
  const period = `Son ${data.periodDays} gün`;

  return (
    <div className="flex flex-col gap-5">
      <AdminQuickLinks
        items={[
          {
            href: "/admin/siparisler",
            label: "Siparişler",
            hint:
              data.attention.ordersToProcess > 0
                ? `${integer.format(data.attention.ordersToProcess)} hazırlanacak`
                : "Tüm siparişler",
          },
          {
            href: "/admin/urunler",
            label: "Ürünler",
            hint:
              data.attention.lowStock.length > 0
                ? `${integer.format(data.attention.lowStock.length)} kritik stok`
                : "Katalog",
          },
          {
            href: "/admin/iadeler",
            label: "İadeler",
            hint:
              data.attention.openReturnRequests > 0
                ? `${integer.format(data.attention.openReturnRequests)} bekleyen`
                : "Talepler",
          },
          {
            href: "/admin/musteriler",
            label: "Müşteriler",
            hint: "Üye listesi",
          },
        ]}
      />

      {/* KPI şeridi */}
      <section
        aria-label="Temel göstergeler"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <Kpi
          label="Ciro"
          icon={icons.revenue}
          value={formatMoney(data.revenue.current)}
          change={data.revenue.changePercent}
          footnote={`Önceki: ${formatMoney(data.revenue.previous)}`}
        />
        <Kpi
          label="Sipariş"
          icon={icons.orders}
          value={integer.format(data.orders.current)}
          change={data.orders.changePercent}
          footnote={`Önceki: ${integer.format(data.orders.previous)}`}
        />
        <Kpi
          label="Ortalama sepet"
          icon={icons.basket}
          value={formatMoney(data.averageOrderValue)}
          change={aovChange}
          footnote="Sipariş başına"
        />
        <Kpi
          label="Yeni müşteri"
          icon={icons.users}
          value={integer.format(data.customers.newCustomers)}
          change={data.customers.newChangePercent}
          footnote="Kayıt olan üye"
        />
      </section>

      {/* Ciro + bekleyen işler */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={`${data.revenueSeries.granularity === "day" ? "Günlük" : "Aylık"} ciro`}
          subtitle={`${period} · iptal ve iadeler hariç`}
          action={<PanelLink href="/admin/siparisler">Siparişler</PanelLink>}
        >
          <RevenueChart
            buckets={data.revenueSeries.buckets}
            granularity={data.revenueSeries.granularity}
          />
        </Panel>

        <Panel
          title="Bekleyen işler"
          subtitle={
            openTasks === 0
              ? "Şu an bekleyen iş yok"
              : `${integer.format(openTasks)} kayıt işlem bekliyor`
          }
        >
          <ul className="-mx-2 flex flex-col">
            {tasks.map((task) => (
              <li key={task.label}>
                <Link
                  href={task.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      task.count > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {task.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-800">
                      {task.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {task.hint}
                    </span>
                  </span>
                  {task.count > 0 ? (
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">
                      {integer.format(task.count)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      {icons.check}
                      Yok
                    </span>
                  )}
                  <span className="text-slate-300 transition-colors group-hover:text-slate-500">
                    {icons.chevron}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Çok satanlar + müşteriler */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="En çok satan ürünler"
          subtitle={period}
          action={<PanelLink href="/admin/urunler">Ürünler</PanelLink>}
        >
          {data.topProducts.length === 0 ? (
            <EmptyState>Bu dönemde satış kaydı bulunmuyor.</EmptyState>
          ) : (
            <>
              {/* Mobil: kart listesi */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {data.topProducts.map((product, index) => (
                  <li
                    key={product.name}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                          #{index + 1}
                        </span>
                        <p
                          className="mt-0.5 truncate text-[13px] font-medium text-slate-800"
                          title={product.name}
                        >
                          {product.name}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
                          {formatMoney(product.revenue)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                          {integer.format(product.quantity)} adet
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(product.quantity / topMax) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Masaüstü: tablo */}
              <table className="hidden w-full table-fixed text-[13px] md:table">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-slate-400">
                    <th className="w-7 pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Ürün</th>
                    <th className="w-36 pb-2 font-medium">
                      <span className="sr-only">Satış payı</span>
                    </th>
                    <th className="w-14 pb-2 text-right font-medium">Adet</th>
                    <th className="w-28 pb-2 text-right font-medium">Ciro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((product, index) => (
                    <tr key={product.name}>
                      <td className="py-2.5 text-[12px] text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td
                        className="truncate py-2.5 pr-3 font-medium text-slate-800"
                        title={product.name}
                      >
                        {product.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(product.quantity / topMax) * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-600 tabular-nums">
                        {integer.format(product.quantity)}
                      </td>
                      <td className="py-2.5 pl-4 text-right font-medium whitespace-nowrap text-slate-900 tabular-nums">
                        {formatMoney(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>

        <Panel title="Müşteriler" subtitle={period}>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[11px] text-slate-500">
                Alışveriş yapan üye
              </dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                {integer.format(data.customers.buyers)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Yeni kayıt</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                {integer.format(data.customers.newCustomers)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-medium text-slate-700">
                Tekrar alışveriş oranı
              </span>
              <span className="text-[13px] font-semibold text-slate-900 tabular-nums">
                {data.customers.returningRate === null
                  ? "—"
                  : `%${integer.format(data.customers.returningRate)}`}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 rounded-full bg-slate-100"
              role="img"
              aria-label={`Tekrar alışveriş oranı yüzde ${data.customers.returningRate ?? 0}`}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${data.customers.returningRate ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {integer.format(data.customers.returningBuyers)} üye daha önce de
              sipariş vermiş
            </p>
          </div>
        </Panel>
      </div>

      {/* Malzemeler + stok */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Popüler turşu malzemeleri"
          subtitle={`“Kendi Turşunu Yap” · ${integer.format(data.popularIngredients.totalJars)} bidon`}
          action={
            <PanelLink href="/admin/tursu-malzemeleri">Malzemeler</PanelLink>
          }
        >
          {data.popularIngredients.items.length === 0 ? (
            <EmptyState>Bu dönemde özel turşu siparişi yok.</EmptyState>
          ) : (
            <ul className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {data.popularIngredients.items.map((item) => (
                <li key={item.name}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                      {integer.format(item.jarCount)} bidon · %
                      {item.sharePercent}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 rounded-full bg-slate-100"
                    role="img"
                    aria-label={`${item.name}: bidonların yüzde ${item.sharePercent}'inde`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, item.sharePercent)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Kritik stok"
          subtitle="Satılabilir adedi eşiğin altında"
          action={<PanelLink href="/admin/urunler">Tümü</PanelLink>}
        >
          {data.attention.lowStock.length === 0 ? (
            <EmptyState>Tüm stoklar yeterli seviyede.</EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-slate-100">
              {data.attention.lowStock.map((item) => (
                <li
                  key={item.sku}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/urunler?q=${encodeURIComponent(item.productName)}`}
                      className="block truncate text-[13px] font-medium text-slate-800 hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <span className="font-mono text-[11px] text-slate-400">
                      {item.sku}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      item.available === 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {item.available === 0
                      ? "Tükendi"
                      : `${item.available} adet`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
