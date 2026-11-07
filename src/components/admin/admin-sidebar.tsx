"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/storefront/logo";
import { siteConfig } from "@/config/site.config";
import type { AdminNavItem } from "@/modules/admin/navigation";

interface AdminSidebarProps {
  nav: AdminNavItem[];
  user?: {
    name: string;
    email: string;
  };
  siteName?: string;
  version?: string;
}

function getNavIcon(href: string) {
  const props = {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (href) {
    case "/admin":
      return (
        <svg {...props}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case "/admin/siparisler":
      return (
        <svg {...props}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "/admin/iadeler":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "/admin/urunler":
      return (
        <svg {...props}>
          <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" x2="7.01" y1="7" y2="7" />
        </svg>
      );
    case "/admin/kategoriler":
      return (
        <svg {...props}>
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      );
    case "/admin/nitelikler":
      return (
        <svg {...props}>
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
        <svg {...props}>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case "/admin/musteriler":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "/admin/bayiler":
      return (
        <svg {...props}>
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
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "/admin/icerik":
      return (
        <svg {...props}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "/admin/personel":
      return (
        <svg {...props}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      );
    case "/admin/roller":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "/admin/denetim":
      return (
        <svg {...props}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "/admin/tursu-malzemeleri":
      return (
        <svg {...props}>
          <path d="M9 2h6v3H9z" />
          <path d="M8 5h8a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" />
          <path d="M5 12h14" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function AdminSidebar({
  nav,
  user: _user,
  siteName: _siteName,
  version = siteConfig.version,
}: AdminSidebarProps) {
  void _user;
  void _siteName;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobil Üst Bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-[#0c1a13] px-4 text-white md:hidden">
        <Logo showBadge inverted compact href="/admin" />
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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-60 flex-col bg-[#0c1a13] text-slate-300 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo — vitrin ile aynı amblem */}
        <div className="flex h-14 items-center justify-between gap-2 border-b border-emerald-950/80 px-3.5">
          <Logo showBadge inverted compact href="/admin" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="shrink-0 text-slate-400 hover:text-white md:hidden"
            aria-label="Menüyü kapat"
          >
            ✕
          </button>
        </div>

        {/* Canlı Sistem Rozeti */}
        <div className="px-3.5 pt-3 pb-1.5">
          <div className="flex items-center justify-between rounded-lg border border-emerald-900/40 bg-emerald-950/40 px-2.5 py-1 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Aktif
            </span>
            <span className="text-[10px] text-slate-400">v{version}</span>
          </div>
        </div>

        {/* Navigasyon Öğeleri */}
        <nav
          aria-label="Yönetim menüsü"
          className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2 [scrollbar-width:none]"
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
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "border-l-2 border-emerald-400 bg-emerald-600/20 font-medium text-white shadow-2xs"
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
      </aside>

      {/* Masaüstünde sidebar için yer, layout'taki md:pl-60 ile ayrılır (ayrı spacer yok). */}

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
