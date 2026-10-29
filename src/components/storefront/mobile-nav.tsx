"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/components/motion/motion";
import {
  ChevronRightIcon,
  HeartIcon,
  MailIcon,
  MenuIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "./icons";
import { Logo } from "./logo";
import { formatMoney } from "@/shared/money";

export interface MobileNavCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MobileNavExtraItem {
  label: string;
  url: string;
}

export interface MobileNavProps {
  categories: MobileNavCategory[];
  extraItems?: MobileNavExtraItem[];
  sitePhone: string;
  siteEmail: string;
  freeShippingThreshold: number;
  wishlistEnabled?: boolean;
  b2bEnabled?: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({
  categories,
  extraItems = [],
  sitePhone,
  siteEmail,
  freeShippingThreshold,
  wishlistEnabled = true,
  b2bEnabled = false,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa yönlendirmesinde menüyü kapat
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Escape tuşu ile kapatma ve arka plan kaydırma kilidi (scroll-lock)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Menü Açma Butonu (Yalnızca dar ekranlarda görünür) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
      >
        <MenuIcon width={22} height={22} />
      </button>

      {/* Açılır Çekmece (Drawer) & Karartma (Backdrop) */}
      <AnimatePresence>
        {isOpen ? (
          <>
            {/* Arka Plan Karartması */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Çekmece Gövdesi */}
            <motion.aside
              key="mobile-nav-panel"
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Gezinti Menüsü"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white shadow-2xl md:hidden"
            >
              {/* Çekmece Başlığı: Logo & Kapat Butonu */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
                <div onClick={() => setIsOpen(false)}>
                  <Logo />
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Menüyü kapat"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <XIcon width={18} height={18} />
                </button>
              </div>

              {/* Çekmece İçeriği (Kaydırılabilir) */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 [scrollbar-width:thin]">
                {/* Öne Çıkan Eylem: Kendi Turşunu Yap */}
                <Link
                  href="/kendi-tursunu-yap"
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-amber-400 p-4 font-semibold text-slate-950 shadow-sm shadow-amber-500/20 transition hover:bg-amber-300"
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-amber-950/70">
                      <span>✦</span> Özel Üretim
                    </span>
                    <span className="text-base font-bold text-slate-950">
                      Kendi Turşunu Yap
                    </span>
                    <span className="text-xs text-amber-950/80">
                      Damak tadına göre bidonunu kendin hazırla
                    </span>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-transform group-hover:translate-x-0.5">
                    <ChevronRightIcon width={16} height={16} />
                  </span>
                </Link>

                {/* Kategoriler */}
                <div className="space-y-2">
                  <span className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                    Kategoriler
                  </span>
                  <nav className="flex flex-col space-y-1">
                    <Link
                      href="/ara"
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        pathname === "/ara"
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>Tüm Ürünler</span>
                      <ChevronRightIcon width={16} height={16} className="text-slate-400" />
                    </Link>

                    {categories.map((category) => {
                      const href = `/kategori/${category.slug}`;
                      const active = isActive(pathname, href);
                      return (
                        <Link
                          key={category.id}
                          href={href}
                          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span>{category.name}</span>
                          <ChevronRightIcon
                            width={16}
                            height={16}
                            className={active ? "text-primary" : "text-slate-400"}
                          />
                        </Link>
                      );
                    })}

                    {extraItems.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span>{item.label}</span>
                        <ChevronRightIcon width={16} height={16} className="text-slate-400" />
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Hesap & Yardım Bağlantıları */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <span className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                    Hesap & Sipariş
                  </span>
                  <div className="flex flex-col space-y-1 text-sm font-medium">
                    <Link
                      href="/hesabim"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserIcon width={18} height={18} className="text-slate-400" />
                      <span>Hesabım & Siparişlerim</span>
                    </Link>

                    <Link
                      href="/siparis-sorgula"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <TruckIcon width={18} height={18} className="text-slate-400" />
                      <span>Sipariş Sorgulama</span>
                    </Link>

                    {wishlistEnabled ? (
                      <Link
                        href="/favoriler"
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <HeartIcon width={18} height={18} className="text-slate-400" />
                        <span>Favorilerim</span>
                      </Link>
                    ) : null}

                    {b2bEnabled ? (
                      <Link
                        href="/bayi-basvuru"
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="text-slate-400">🤝</span>
                        <span>Bayi Başvurusu</span>
                      </Link>
                    ) : null}
                  </div>
                </div>

                {/* İletişim & Kargo Güvencesi */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-3">
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <TruckIcon width={16} height={16} className="shrink-0 text-emerald-800" />
                    <span>
                      <strong>{formatMoney(freeShippingThreshold)}</strong> üzeri siparişlerde kargo ücretsiz
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200/70 pt-2.5">
                    <a
                      href={`tel:${sitePhone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 font-medium text-slate-700 transition hover:text-primary"
                    >
                      <PhoneIcon width={14} height={14} className="text-slate-400" />
                      <span>{sitePhone}</span>
                    </a>
                    <a
                      href={`mailto:${siteEmail}`}
                      className="flex items-center gap-2 font-medium text-slate-700 transition hover:text-primary"
                    >
                      <MailIcon width={14} height={14} className="text-slate-400" />
                      <span>{siteEmail}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Çekmece Altı */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-center text-[11px] text-slate-400">
                <span>🌿 Doğal Fermantasyon Ev Turşusu</span>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
