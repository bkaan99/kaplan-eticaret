import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminPanel,
  AdminTabs,
} from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { adminPage } from "@/modules/admin/guard";
import { getWholesaleLeadService } from "@/modules/wholesale/container";
import type { WholesaleLeadStatus } from "@/modules/wholesale/wholesale.types";
import { PERMISSIONS } from "@/shared/permissions";
import { LeadRowActions } from "./lead-row-actions";

export const metadata: Metadata = { title: "Toptan başvuruları" };

const STATUS_LABELS: Record<WholesaleLeadStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "Görüşüldü",
  CLOSED: "Kapandı",
};

const TONES: Record<
  WholesaleLeadStatus,
  "warning" | "info" | "success" | "danger"
> = {
  NEW: "warning",
  CONTACTED: "info",
  CLOSED: "success",
};

function parseStatus(value: string | undefined): WholesaleLeadStatus | "ALL" {
  if (value === "CONTACTED" || value === "CLOSED" || value === "NEW") {
    return value;
  }
  return "ALL";
}

async function WholesaleLeadsContent({
  searchParams,
}: Pick<PageProps<"/admin/toptan">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.CUSTOMER_READ);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const active = parseStatus(
    typeof params["durum"] === "string" ? params["durum"] : undefined,
  );
  const filter = active === "ALL" ? undefined : active;
  const leads = await getWholesaleLeadService().list(filter);
  const canUpdate = user.permissions.includes(PERMISSIONS.CUSTOMER_UPDATE);

  return (
    <div className="flex flex-col gap-4">
      <AdminTabs
        active={active}
        items={[
          { href: "/admin/toptan", label: "Tümü", value: "ALL" },
          { href: "/admin/toptan?durum=NEW", label: "Yeni", value: "NEW" },
          {
            href: "/admin/toptan?durum=CONTACTED",
            label: "Görüşüldü",
            value: "CONTACTED",
          },
          {
            href: "/admin/toptan?durum=CLOSED",
            label: "Kapandı",
            value: "CLOSED",
          },
        ]}
      />

      {leads.length === 0 ? (
        <AdminPanel>
          <AdminEmpty
            title="Toptan başvurusu yok"
            description={
              active === "ALL"
                ? "Henüz /toptan formundan başvuru gelmemiş."
                : "Bu durumda kayıt bulunmuyor."
            }
          />
        </AdminPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <AdminPanel key={lead.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-bold text-slate-900 sm:text-base">
                    {lead.companyName}
                  </h2>
                  <Badge tone={TONES[lead.status]}>
                    {STATUS_LABELS[lead.status]}
                  </Badge>
                </div>
                <span className="text-[12px] text-slate-500 sm:text-sm">
                  {lead.createdAt.toLocaleString("tr-TR")}
                </span>
              </div>

              <div className="mt-3 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-800">E-posta:</span>{" "}
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {lead.email}
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Telefon:</span>{" "}
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {lead.phone}
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Şehir:</span>{" "}
                  {lead.city}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    İşletme:
                  </span>{" "}
                  {lead.businessType}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Miktar:</span>{" "}
                  {lead.orderVolume}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    İletişim:
                  </span>{" "}
                  {lead.contactChannels.join(", ")}
                </p>
              </div>

              {lead.details ? (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">
                    Açıklama:
                  </span>{" "}
                  {lead.details}
                </p>
              ) : null}
              {lead.note ? (
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Not:</span>{" "}
                  {lead.note}
                </p>
              ) : null}
              {lead.adminNote ? (
                <p className="mt-1 text-sm text-slate-500">
                  Personel notu: {lead.adminNote}
                </p>
              ) : null}

              {canUpdate ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <LeadRowActions id={lead.id} status={lead.status} />
                </div>
              ) : null}
            </AdminPanel>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminWholesalePage({
  searchParams,
}: PageProps<"/admin/toptan">) {
  return (
    <>
      <PageHeader
        title="Toptan başvuruları"
        description="Sitedeki /toptan formundan gelen fiyat teklifi taleplerini inceleyin."
      />
      <Suspense fallback={<AdminLoading />}>
        <WholesaleLeadsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
