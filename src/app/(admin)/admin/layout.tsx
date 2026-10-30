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

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] md:flex-row">
      {/* Sol Menü / Sidebar (sabit) */}
      <AdminSidebar
        nav={nav}
        user={{
          name: user.name || "",
          email: user.email,
        }}
        siteName={siteConfig.name}
      />

      {/* Sağ Ana İçerik Alanı */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Üst Yönetici Başlık Çubuğu */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 shadow-2xs backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {siteConfig.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.name || user.email} · Yönetici oturumu
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:px-3.5"
            >
              <span className="hidden sm:inline">Mağazayı Görüntüle</span>
              <span className="sm:hidden">Mağaza</span>
              <span className="text-slate-400">↗</span>
            </Link>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-500">
                Çevrimiçi
              </span>
            </div>
            <AdminLogoutButton variant="header" />
          </div>
        </header>

        {/* Ana Sayfa İçeriği */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
