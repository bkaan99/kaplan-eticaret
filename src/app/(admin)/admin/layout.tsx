import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { features } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { visibleNav } from "@/modules/admin/navigation";
import { requireStaff } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli", template: "%s | Yönetim Paneli" },
  robots: { index: false, follow: false },
};

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const nav = visibleNav(user.permissions, { b2bEnabled: features.b2b });
  const initial = (user.name?.trim() || user.email?.trim() || "Y").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-[13px] leading-normal text-slate-700 antialiased md:flex-row">
      {/* Sol Menü / Sidebar (sabit) */}
      <AdminSidebar
        nav={nav}
        siteName={siteConfig.name}
        version={siteConfig.version}
      />

      {/* Sağ Ana İçerik Alanı */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Üst Yönetici Başlık Çubuğu */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-2xs backdrop-blur-md sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-900">
              {siteConfig.name}
            </p>
            <p className="truncate text-[11px] text-slate-500">Yönetim Paneli</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:px-3"
            >
              <span className="hidden sm:inline">Mağazayı Görüntüle</span>
              <span className="sm:hidden">Mağaza</span>
              <span className="text-slate-400">↗</span>
            </Link>
            <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-2.5 sm:flex">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500">
                Çevrimiçi
              </span>
            </div>

            {/* Yönetici Profil Kartı */}
            <Link
              href="/hesabim"
              className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/90 py-1 pl-1 pr-2 transition hover:border-slate-300 hover:bg-slate-100 sm:pr-2.5"
              title="Profilimi Görüntüle"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-semibold text-slate-950 shadow-2xs">
                {initial}
              </div>
              <div className="hidden max-w-[140px] flex-col text-left sm:flex">
                <span className="truncate text-[12px] font-medium leading-tight text-slate-800 transition-colors group-hover:text-emerald-700">
                  {user.name || user.email}
                </span>
                <span className="text-[10px] font-medium leading-tight text-emerald-600">
                  Yönetici Hesabı
                </span>
              </div>
            </Link>

            <AdminLogoutButton variant="header" />
          </div>
        </header>

        {/* Ana Sayfa İçeriği */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Yönetim paneli yükleniyor...</span>
          </div>
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
