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
        title="Site & İletişim"
        description="Telefon, WhatsApp, e-posta, adres ve sosyal bağlantılar — vitrin, footer ve iletişim sayfasında kullanılır."
        actions={
          <Link
            href="/iletisim"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            İletişim sayfası
            <span className="text-slate-400">↗</span>
          </Link>
        }
      />
      <Suspense fallback={<AdminLoading label="Ayarlar yükleniyor..." />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}
