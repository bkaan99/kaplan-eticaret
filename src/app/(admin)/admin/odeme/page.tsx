import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { adminPage } from "@/modules/admin/guard";
import { getPaymentModeService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";
import { absoluteUrl } from "@/shared/site-url";
import { PaymentModeForm } from "./payment-mode-form";

export const metadata: Metadata = { title: "Ödeme Ayarları" };

async function PaymentContent() {
  const user = await adminPage(PERMISSIONS.SETTING_MANAGE);
  if (!user) return <AccessDenied />;

  const service = getPaymentModeService();
  const mode = await service.get();

  return (
    <PaymentModeForm
      currentMode={mode}
      paytrConfigured={service.isPaytrConfigured()}
      callbackUrl={absoluteUrl("/api/payments/paytr/callback")}
    />
  );
}

export default function AdminPaymentPage() {
  return (
    <>
      <PageHeader
        title="Ödeme Ayarları"
        description="Kart ödemesinin test modunda mı yoksa canlıda mı çalışacağını buradan seçin."
      />
      <Suspense
        fallback={<AdminLoading label="Ödeme ayarları yükleniyor..." />}
      >
        <PaymentContent />
      </Suspense>
    </>
  );
}
