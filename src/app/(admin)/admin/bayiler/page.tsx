import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminPanel,
  AdminTabs,
} from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { features } from "@/config/features";
import { adminPage } from "@/modules/admin/guard";
import { getDealerService } from "@/modules/b2b/container";
import type { DealerStatus } from "@/modules/b2b/dealer.types";
import { PERMISSIONS } from "@/shared/permissions";
import { DealerRow } from "./dealer-row";

export const metadata: Metadata = { title: "Bayiler" };

function isStatus(value: string | undefined): value is DealerStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

async function DealersContent({
  searchParams,
}: Pick<PageProps<"/admin/bayiler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.B2B_APPROVE);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const raw = typeof params["durum"] === "string" ? params["durum"] : "PENDING";
  const status = isStatus(raw) ? raw : undefined;

  const service = getDealerService();
  const [dealers, groups] = await Promise.all([
    service.list({ status }),
    service.listGroups(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <AdminTabs
        active={raw}
        items={[
          {
            href: "/admin/bayiler?durum=PENDING",
            label: "Bekleyenler",
            value: "PENDING",
          },
          {
            href: "/admin/bayiler?durum=APPROVED",
            label: "Onaylılar",
            value: "APPROVED",
          },
          {
            href: "/admin/bayiler?durum=REJECTED",
            label: "Reddedilenler",
            value: "REJECTED",
          },
          { href: "/admin/bayiler?durum=ALL", label: "Tümü", value: "ALL" },
        ]}
      />

      {groups.length === 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          Onaylamadan önce en az bir müşteri grubu tanımlayın (Bayi grupları).
        </div>
      ) : null}

      {dealers.length === 0 ? (
        <AdminPanel>
          <AdminEmpty
            title="Gösterilecek kayıt yok"
            description="Seçili durum için bayi başvurusu bulunmuyor."
          />
        </AdminPanel>
      ) : (
        <ul className="flex flex-col gap-3">
          {dealers.map((dealer) => (
            <DealerRow
              key={dealer.userId}
              dealer={{
                userId: dealer.userId,
                name: dealer.name,
                email: dealer.email,
                status: dealer.status,
                companyName: dealer.companyName,
                taxNumber: dealer.taxNumber,
                taxOffice: dealer.taxOffice,
                groupId: dealer.groupId,
                groupName: dealer.groupName,
                creditLimit: dealer.creditLimit,
                minOrderAmount: dealer.minOrderAmount,
                note: dealer.note,
              }}
              groups={groups.map((group) => ({
                id: group.id,
                name: group.name,
              }))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDealersPage({
  searchParams,
}: PageProps<"/admin/bayiler">) {
  if (!features.b2b) notFound();

  return (
    <>
      <PageHeader
        title="Bayiler"
        description="Bayi başvurularını değerlendirin; grup, kredi limiti ve minimum sipariş tutarını belirleyin."
      />
      <Suspense fallback={<AdminLoading label="Bayiler yükleniyor..." />}>
        <DealersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
