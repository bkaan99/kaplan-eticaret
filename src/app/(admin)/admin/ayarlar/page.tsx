import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { adminPage } from "@/modules/admin/guard";
import { settingsService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Site & İletişim Ayarları" };

async function SettingsContent() {
  const user = await adminPage(PERMISSIONS.SETTING_MANAGE);
  if (!user) return <AccessDenied />;

  const settings = await settingsService.getContactSettings();
  return <SettingsForm initialSettings={settings} />;
}

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Site & İletişim Ayarları"
        description="Mağazanın müşteri hizmetleri telefon numarası, WhatsApp hattı, e-posta ve fabrika/tesis açık adresini buradan dinamik olarak güncelleyebilirsiniz."
      />
      <Suspense
        fallback={<p className="text-muted-foreground">Yükleniyor...</p>}
      >
        <SettingsContent />
      </Suspense>
    </>
  );
}
