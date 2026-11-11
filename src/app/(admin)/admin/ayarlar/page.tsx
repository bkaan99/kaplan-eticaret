import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { adminPage } from "@/modules/admin/guard";
import { settingsService } from "@/modules/settings/container";
import { PERMISSIONS } from "@/shared/permissions";
import { SettingsWorkspace } from "./settings-workspace";

export const metadata: Metadata = { title: "Site & İletişim Ayarları" };

async function SettingsContent() {
  const user = await adminPage(PERMISSIONS.SETTING_MANAGE);
  if (!user) return <AccessDenied />;

  const [contact, shipping] = await Promise.all([
    settingsService.getContactSettings(),
    settingsService.getShippingSettings(),
  ]);

  return <SettingsWorkspace contact={contact} shipping={shipping} />;
}

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Site & İletişim"
        description="Vitrinde görünen iletişim kanalları ve ücretsiz kargo eşiği. Değişiklikler footer, iletişim sayfası, WhatsApp butonu ve ödeme hesabına yansır."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Ana sayfa
              <span className="text-slate-400">↗</span>
            </Link>
            <Link
              href="/iletisim"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              İletişim sayfası
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
