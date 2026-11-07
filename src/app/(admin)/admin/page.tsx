import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { adminPage } from "@/modules/admin/guard";
import { reportingService } from "@/modules/reporting/container";
import { parseReportPeriod } from "@/modules/reporting/reporting.service";
import { PERMISSIONS } from "@/shared/permissions";
import { DashboardView, PeriodSwitcher } from "./dashboard-view";

const today = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Istanbul",
});

async function DashboardContent({
  searchParams,
}: Pick<PageProps<"/admin">, "searchParams">) {
  const user = await adminPage();
  if (!user) return <AccessDenied />;

  const greeting = `Hoş geldiniz, ${user.name || user.email} · ${today.format(new Date())}`;

  if (!user.permissions.includes(PERMISSIONS.REPORT_VIEW)) {
    return (
      <>
        <PageHeader title="Pano" description={greeting} />
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-xs">
          Sol menüden çalışmak istediğiniz bölümü seçebilirsiniz.
        </p>
      </>
    );
  }

  const params = await searchParams;
  const period = parseReportPeriod(
    typeof params["gun"] === "string" ? params["gun"] : undefined,
  );
  const data = await reportingService.dashboard(period);

  return (
    <>
      <PageHeader
        title="Pano"
        description={greeting}
        actions={<PeriodSwitcher period={period} />}
      />
      <DashboardView data={data} />
    </>
  );
}

export default function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Pano" description="Mağaza özeti yükleniyor" />
          <AdminLoading label="İstatistikler hesaplanıyor..." />
        </>
      }
    >
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
