"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AdminNavItem } from "@/modules/admin/navigation";
import { AdminLogoutButton } from "./admin-logout-button";

interface AdminSidebarProps {
  nav: AdminNavItem[];
  user: {
    name: string;
    email: string;
  };
  siteName: string;
}

function getNavIcon(href: string) {
  switch (href) {
    case "/admin":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case "/admin/siparisler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "/admin/iadeler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "/admin/urunler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" x2="7.01" y1="7" y2="7" />
        </svg>
      );
    case "/admin/kategoriler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      );
    case "/admin/nitelikler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="21" y2="21" />
          <line x1="4" x2="20" y1="14" y2="14" />
          <line x1="4" x2="20" y1="7" y2="7" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="14" r="2" />
          <circle cx="7" cy="21" r="2" />
        </svg>
      );
    case "/admin/kuponlar":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case "/admin/musteriler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "/admin/bayiler":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      );
    case "/admin/bayi-gruplari":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "/admin/icerik":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "/admin/personel":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      );
    case "/admin/roller":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "/admin/denetim":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "/admin/tursu-malzemeleri":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2h6v3H9z" />
          <path d="M8 5h8a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" />
          <path d="M5 12h14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function AdminSidebar({ nav, user, siteName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobil Üst Bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-[#0c1a13] px-4 text-white md:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-black">
            K
          </span>
          <span className="text-sm tracking-wide">Yönetim Paneli</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white"
          aria-label="Menüyü aç/kapat"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Kenar Çubuğu — masaüstünde sabit (scroll etmez) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col bg-[#0c1a13] text-slate-300 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo & Marka Başlığı */}
        <div className="flex h-16 items-center justify-between border-b border-emerald-950/80 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white shadow-xs">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight">{siteName}</span>
              <span className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">
                Yönetim Paneli
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Canlı Sistem Rozeti */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-900/40 px-3 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Aktif
            </span>
            <span className="text-[10px] text-slate-400">v0.6.2</span>
          </div>
        </div>

        {/* Navigasyon Öğeleri */}
        <nav
          aria-label="Yönetim menüsü"
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [scrollbar-width:none]"
        >
          {nav.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-600/20 text-white font-semibold shadow-xs border-l-2 border-emerald-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {getNavIcon(item.href)}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Alt Kullanıcı & Mağaza Kartı */}
        <div className="border-t border-emerald-950/80 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-xs">
              {initial}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-bold text-white">
                {user.name || user.email}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Yönetici</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1 text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <span>Mağazayı Gör</span>
              <span>↗</span>
            </Link>
            <Link
              href="/hesabim"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Profilim
            </Link>
          </div>

          <div className="mt-3">
            <AdminLogoutButton variant="sidebar" />
          </div>
        </div>
      </aside>

      {/* Masaüstü spacer: fixed sidebar için yer ayırır */}
      <div className="hidden w-64 shrink-0 md:block" aria-hidden="true" />

      {/* Mobil Backdrop */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </>
  );
}
