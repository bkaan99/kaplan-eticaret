"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/storefront/logo";
import { siteConfig } from "@/config/site.config";
import {
  ADMIN_NAV_GROUP_LABELS,
  ADMIN_NAV_GROUP_ORDER,
  type AdminNavGroup,
  type AdminNavItem,
} from "@/modules/admin/navigation";
import { cn } from "@/shared/cn";
import { AdminLogoutButton } from "./admin-logout-button";

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
    width: 18,
    height: 18,
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
    case "/admin/odeme":
      return (
        <svg {...props}>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "/admin/ayarlar":
      return (
        <svg {...props}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
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

function isItemActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  nav,
  user,
  version = siteConfig.version,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(
    () =>
      nav.find((item) => isItemActive(pathname, item.href)) ??
      nav.find((item) => item.href === "/admin") ??
      null,
    [nav, pathname],
  );

  const grouped = useMemo(() => {
    const map = new Map<AdminNavGroup, AdminNavItem[]>();
    for (const group of ADMIN_NAV_GROUP_ORDER) map.set(group, []);
    for (const item of nav) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return ADMIN_NAV_GROUP_ORDER.map((group) => ({
      group,
      label: ADMIN_NAV_GROUP_LABELS[group],
      items: map.get(group) ?? [],
    })).filter((section) => section.items.length > 0);
  }, [nav]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Tek mobil üst bar */}
      <div className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-emerald-950/80 bg-[#0c1a13] px-3 py-2 text-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition active:bg-white/10"
          aria-label="Menüyü aç"
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-drawer"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-tight text-white">
            {activeItem?.label ?? "Yönetim"}
          </p>
          <p className="truncate text-[11px] text-emerald-200/70">
            {siteConfig.name}
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex h-10 shrink-0 items-center rounded-xl border border-white/15 bg-white/5 px-2.5 text-[12px] font-medium text-emerald-100 transition active:bg-white/10"
        >
          Mağaza
          <span className="ml-1 text-white/40">↗</span>
        </Link>
      </div>

      <aside
        id="admin-mobile-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,88vw)] flex-col bg-[#0c1a13] text-slate-300 transition-transform duration-300 ease-out md:w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-emerald-950/80 px-3.5">
          <Logo showBadge inverted compact href="/admin" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Menüyü kapat"
          >
            ✕
          </button>
        </div>

        <div className="px-3.5 pt-3 pb-1.5">
          <div className="flex items-center justify-between rounded-lg border border-emerald-900/40 bg-emerald-950/40 px-2.5 py-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Sistem aktif
            </span>
            <span className="text-[10px] text-slate-400">v{version}</span>
          </div>
        </div>

        {user ? (
          <div className="mx-3.5 mb-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 md:hidden">
            <p className="truncate text-[13px] font-semibold text-white">
              {user.name || user.email}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user.email}</p>
          </div>
        ) : null}

        <nav
          aria-label="Yönetim menüsü"
          className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-2.5 py-2 [scrollbar-width:thin]"
        >
          {grouped.map((section) => (
            <div key={section.group} className="space-y-1">
              <p className="px-2.5 pb-0.5 text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors md:min-h-0 md:gap-2.5 md:rounded-lg md:px-2.5 md:py-2 md:text-[13px]",
                      active
                        ? "bg-emerald-600/20 font-semibold text-white shadow-2xs ring-1 ring-emerald-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "transition-colors",
                        active
                          ? "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300",
                      )}
                    >
                      {getNavIcon(item.href)}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-emerald-950/80 p-3 md:hidden">
          <Link
            href="/"
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] font-medium text-emerald-100 transition hover:bg-white/10"
          >
            Mağazayı aç
            <span className="text-white/40">↗</span>
          </Link>
          <AdminLogoutButton variant="sidebar" />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </>
  );
}
