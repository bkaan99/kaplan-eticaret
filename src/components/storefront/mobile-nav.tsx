"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
import {
  BagIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  InstagramIcon,
  BidonThumb,
  MailIcon,
  MapPinIcon,
  MenuIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "./icons";
import { Logo } from "./logo";
import { MobileNavAdminLink } from "./storefront-shell";
import { storefrontContact } from "@/config/storefront-contact";
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
  sitePhoneTel?: string;
  siteEmail: string;
  workingHours?: string;
  freeShippingThreshold: number;
  wishlistEnabled?: boolean;
  b2bEnabled?: boolean;
  /** Portal body'ye taşındığı için vitrin font değişkenlerini çekmeceye aktarır. */
  drawerFontClassName?: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({
  categories,
  extraItems = [],
  sitePhone,
  sitePhoneTel,
  siteEmail,
  workingHours,
  freeShippingThreshold,
  wishlistEnabled = true,
  b2bEnabled = false,
  drawerFontClassName,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [navPath, setNavPath] = useState(pathname);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Rota değişince menüyü kapat (render sırasında state ayarı)
  if (pathname !== navPath) {
    setNavPath(pathname);
    if (isOpen) setIsOpen(false);
  }

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

  const drawer =
    mounted && isOpen
      ? createPortal(
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] animate-[fade-in_200ms_ease-out] bg-black/50 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            <aside
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Gezinti Menüsü"
              className={`fixed inset-y-0 left-0 z-[100] flex w-[85vw] max-w-sm animate-[drawer-in-left_280ms_ease-out] flex-col bg-white pt-[env(safe-area-inset-top)] shadow-2xl md:hidden${drawerFontClassName ? ` ${drawerFontClassName}` : ""}`}
            >
              {/* Çekmece Başlığı: Logo & Kapat Butonu */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
                <div onClick={() => setIsOpen(false)}>
                  <Logo showBadge />
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Menüyü kapat"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <XIcon width={18} height={18} />
                </button>
              </div>

              {/* Çekmece İçeriği (Kaydırılabilir) */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 [scrollbar-width:thin]">
                {/* Öne Çıkan Eylem: Kendi Turşunu Yap */}
                <Link
                  href="/kendi-tursunu-yap"
                  className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-brand-dark p-4 text-[#f6efe0] shadow-[0_8px_24px_-8px_rgba(11,35,24,0.5)] ring-1 ring-brand-gold/20 transition-all duration-200 hover:ring-brand-gold/40"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-gold/10 blur-2xl transition-opacity group-hover:bg-brand-gold/20"
                  />
                  <div className="relative flex flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-gold">
                      Özel Üretim
                    </span>
                    <span className="inline-flex items-center gap-2.5 text-base font-semibold">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/15 ring-1 ring-brand-gold/30">
                        <BidonThumb width={22} height={26} />
                      </span>
                      Kendi Turşunu Yap
                    </span>
                    <span className="text-xs text-[#f6efe0]/75">
                      Damak tadına göre bidonunu kendin hazırla
                    </span>
                  </div>
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f6efe0] ring-1 ring-white/15 transition-transform group-hover:translate-x-0.5">
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
                      <ChevronRightIcon
                        width={16}
                        height={16}
                        className="text-slate-400"
                      />
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
                            className={
                              active ? "text-primary" : "text-slate-400"
                            }
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
                        <ChevronRightIcon
                          width={16}
                          height={16}
                          className="text-slate-400"
                        />
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
                    <MobileNavAdminLink />

                    <Link
                      href="/hesabim"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserIcon
                        width={18}
                        height={18}
                        className="text-slate-400"
                      />
                      <span>Hesabım & Siparişlerim</span>
                    </Link>

                    <Link
                      href="/siparis-sorgula"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <TruckIcon
                        width={18}
                        height={18}
                        className="text-slate-400"
                      />
                      <span>Sipariş Sorgulama</span>
                    </Link>

                    {wishlistEnabled ? (
                      <Link
                        href="/favoriler"
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <HeartIcon
                          width={18}
                          height={18}
                          className="text-slate-400"
                        />
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

                    <Link
                      href="/iletisim"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <MapPinIcon
                        width={18}
                        height={18}
                        className="text-slate-400"
                      />
                      <span>İletişim & Mağazamız</span>
                    </Link>
                  </div>
                </div>

                {/* İletişim & Kargo Güvencesi */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-3">
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <TruckIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-emerald-800"
                    />
                    <span>
                      <strong>{formatMoney(freeShippingThreshold)}</strong>{" "}
                      üzeri siparişlerde kargo ücretsiz
                    </span>
                  </div>

                  <div className="space-y-2.5 border-t border-slate-200/70 pt-2.5">
                    <a
                      href={`tel:${sitePhoneTel ?? sitePhone.replace(/\s/g, "")}`}
                      className="flex items-start gap-2.5 text-sm leading-snug font-medium text-slate-700 transition hover:text-primary"
                    >
                      <PhoneIcon
                        width={20}
                        height={20}
                        className="mt-0.5 size-5 shrink-0 text-slate-400"
                      />
                      <span>{sitePhone}</span>
                    </a>
                    <a
                      href={`mailto:${siteEmail}`}
                      className="flex items-start gap-2.5 text-sm leading-snug font-medium text-slate-700 transition hover:text-primary"
                    >
                      <MailIcon
                        width={20}
                        height={20}
                        className="mt-0.5 size-5 shrink-0 text-slate-400"
                      />
                      <span>{siteEmail}</span>
                    </a>
                    <a
                      href={storefrontContact.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 text-sm leading-snug text-slate-600 transition hover:text-primary"
                    >
                      <MapPinIcon
                        width={20}
                        height={20}
                        className="mt-0.5 size-5 shrink-0 text-slate-400"
                      />
                      <span>{storefrontContact.address}</span>
                    </a>
                    <a
                      href={storefrontContact.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 text-sm leading-snug font-medium text-slate-700 transition hover:text-primary"
                    >
                      <InstagramIcon
                        width={20}
                        height={20}
                        className="mt-0.5 size-5 shrink-0 text-slate-400"
                      />
                      <span>Instagram</span>
                    </a>
                    <a
                      href={storefrontContact.trendyolUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 text-sm leading-snug font-medium text-slate-700 transition hover:text-primary"
                    >
                      <BagIcon
                        width={20}
                        height={20}
                        className="mt-0.5 size-5 shrink-0 text-slate-400"
                      />
                      <span>Trendyol Mağazası</span>
                    </a>
                    {workingHours ? (
                      <p className="flex items-start gap-2.5 text-sm leading-snug text-slate-600">
                        <ClockIcon
                          width={20}
                          height={20}
                          className="mt-0.5 size-5 shrink-0 text-slate-400"
                        />
                        <span>{workingHours}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Çekmece Altı */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[11px] text-slate-400">
                <span>🌿 Doğal Fermantasyon Ev Turşusu</span>
              </div>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        className="ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-primary text-primary transition-colors hover:bg-primary/5 md:hidden"
      >
        <MenuIcon width={22} height={22} />
      </button>
      {drawer}
    </>
  );
}
