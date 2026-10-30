import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminPanel,
  AdminTabs,
} from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { adminPage } from "@/modules/admin/guard";
import { getReturnService } from "@/modules/returns/container";
import type { ReturnStatus } from "@/modules/returns/return.types";
import { PERMISSIONS } from "@/shared/permissions";
import { ReturnRowActions } from "./return-row-actions";

export const metadata: Metadata = { title: "İade talepleri" };

const STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "İade edildi",
};

const TONES: Record<ReturnStatus, "warning" | "info" | "danger" | "success"> = {
  REQUESTED: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  COMPLETED: "success",
};

async function ReturnsContent({
  searchParams,
}: Pick<PageProps<"/admin/iadeler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.RETURN_MANAGE);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const showAll = Boolean(params["tum"]);
  const filter = showAll ? undefined : ("REQUESTED" as const);
  const requests = await getReturnService().list(filter);

  return (
    <div className="flex flex-col gap-4">
      <AdminTabs
        active={showAll ? "ALL" : "REQUESTED"}
        items={[
          { href: "/admin/iadeler", label: "Bekleyenler", value: "REQUESTED" },
          { href: "/admin/iadeler?tum=1", label: "Tümü", value: "ALL" },
        ]}
      />

      {requests.length === 0 ? (
        <AdminPanel>
          <AdminEmpty
            title="Gösterilecek iade talebi yok"
            description={
              showAll
                ? "Henüz oluşturulmuş bir iade kaydı bulunmuyor."
                : "Bekleyen iade talebi yok. Tüm kayıtlara geçerek geçmiş talepleri görebilirsiniz."
            }
          />
        </AdminPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <AdminPanel key={request.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/admin/siparisler/${request.orderNumber}`}
                  className="text-base font-bold text-slate-900 hover:text-primary"
                >
                  {request.orderNumber}
                </Link>
                <Badge tone={TONES[request.status]}>
                  {STATUS_LABELS[request.status]}
                </Badge>
                <span className="text-sm text-slate-500">
                  {request.email} · {request.createdAt.toLocaleString("tr-TR")}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {request.items.map((item, index) => (
                  <li key={index}>
                    {item.productName}
                    {item.variantName ? ` · ${item.variantName}` : ""} ×{" "}
                    {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid gap-1 text-sm">
                <p>
                  <span className="font-semibold text-slate-800">Neden:</span>{" "}
                  {request.reason}
                  {request.note ? ` — ${request.note}` : ""}
                </p>
                <p>
                  İade tutarı:{" "}
                  <strong className="text-slate-900">
                    <Price value={request.refundAmount} />
                  </strong>
                </p>
                {request.adminNote ? (
                  <p className="text-slate-500">Not: {request.adminNote}</p>
                ) : null}
              </div>

              {request.status === "REQUESTED" ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <ReturnRowActions
                    requestId={request.id}
                    amount={request.refundAmount}
                  />
                </div>
              ) : null}
            </AdminPanel>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReturnsPage({
  searchParams,
}: PageProps<"/admin/iadeler">) {
  return (
    <>
      <PageHeader
        title="İade talepleri"
        description="Müşteri iade taleplerini inceleyin, onaylayın veya reddedin."
      />
      <Suspense fallback={<AdminLoading label="İade talepleri yükleniyor..." />}>
        <ReturnsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
