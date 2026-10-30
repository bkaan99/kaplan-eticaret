import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
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
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>Mağazada Canlı Gör</span>
              <span className="text-slate-400">↗</span>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<AdminLoading label="Ayarlar yükleniyor..." />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}
