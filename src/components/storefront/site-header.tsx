import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedMenu } from "@/modules/content/cached";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { formatMoney } from "@/shared/money";
import { AccountLink } from "./account-link";
import { CartBadge } from "./cart-badge";
import { HeaderNav } from "./header-nav";
import { BidonThumb, HeartIcon, TruckIcon } from "./icons";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

async function MobileNavContainer() {
  await connection();
  const [tree, extra, contact] = await Promise.all([
    getCategoryTree(),
    getCachedMenu("header"),
    getCachedContactSettings(),
  ]);

  return (
    <MobileNav
      categories={tree}
      extraItems={extra.map((item) => ({ label: item.label, url: item.url }))}
      sitePhone={storefrontContact.phone}
      sitePhoneTel={storefrontContact.phoneTel}
      siteEmail={contact.email}
      workingHours={storefrontContact.workingHours}
      freeShippingThreshold={siteConfig.shipping.freeShippingThreshold}
      wishlistEnabled={isFeatureEnabled("wishlist")}
      b2bEnabled={isFeatureEnabled("b2b")}
    />
  );
}

async function CategoryNav() {
  await connection();
  const [tree, extra] = await Promise.all([
    getCategoryTree(),
    getCachedMenu("header"),
  ]);

  return (
    <HeaderNav
      items={[
        { href: "/ara", label: "Tüm Ürünler" },
        ...tree.map((category) => ({
          href: `/kategori/${category.slug}`,
          label: category.name,
        })),
        ...extra.map((item) => ({ href: item.url, label: item.label })),
      ]}
    />
  );
}

function SearchForm({ className = "" }: { className?: string }) {
  return (
    <form action="/ara" role="search" className={`relative ${className}`}>
      <input
        name="q"
        type="search"
        placeholder="Turşu, şalgam, hediye kutusu ara…"
        aria-label="Ürün ara"
        className="h-12 w-full rounded-full border border-slate-200 bg-[#f4f5f0] pr-24 pl-5 text-sm font-semibold text-slate-900 transition-colors outline-none placeholder:font-semibold placeholder:text-slate-500 focus:border-primary focus:bg-white"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 rounded-r-full bg-primary px-7 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
      >
        Ara
      </button>
    </form>
  );
}

function BuilderLink() {
  return (
    <Link
      href="/kendi-tursunu-yap"
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary py-1 pr-4 pl-2 text-[13px] font-extrabold whitespace-nowrap text-white transition-colors hover:bg-brand-dark"
    >
      <BidonThumb width={16} height={20} />
      Kendi Turşunu Yap
    </Link>
  );
}

const iconLinkClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5";

const secondaryLinkClass =
  "rounded-full px-2.5 py-2 text-[13px] font-bold whitespace-nowrap text-primary transition-colors hover:text-brand-dark hover:underline";

export function SiteHeader() {
  return (
    <>
      {/* Üst duyuru bandı: sayfayla birlikte kayar */}
      <div className="bg-primary text-white">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium sm:text-sm">
          {formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri
          siparişlerde{" "}
          <strong className="font-extrabold">kargo ücretsiz!</strong>
        </p>
      </div>

      <header className="relative z-40 border-b border-slate-200 bg-white md:sticky md:top-0">
        {/* Satır 1: logo · arama · aksiyonlar. Dar ekranda arama alt satıra iner. */}
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-6">
          <Logo showBadge />
          <SearchForm className="order-last col-span-2 min-w-0 md:order-none md:col-span-1" />
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link
              href="/siparis-sorgula"
              className={`${iconLinkClass} max-md:hidden`}
              aria-label="Sipariş takibi"
              title="Sipariş takibi"
            >
              <TruckIcon />
            </Link>
            {isFeatureEnabled("wishlist") ? (
              <Link
                href="/favoriler"
                className={`${iconLinkClass} max-md:hidden`}
                aria-label="Favoriler"
                title="Favoriler"
              >
                <HeartIcon />
              </Link>
            ) : null}
            {/* Dar ekranda hesap bağlantısı çekmecede */}
            <div className="contents max-sm:hidden">
              <Suspense fallback={<span className={iconLinkClass} />}>
                <AccountLink className={iconLinkClass} />
              </Suspense>
            </div>
            <Suspense fallback={<span className="h-10 w-24" />}>
              <CartBadge />
            </Suspense>
            <Suspense fallback={<div className="h-10 w-10 md:hidden" />}>
              <MobileNavContainer />
            </Suspense>
          </div>
        </div>

        {/* Satır 2: öne çıkan bağlantı · kategoriler · mağaza ve iletişim */}
        <div className="hidden border-t border-slate-100 md:block">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5">
            <BuilderLink />
            <div className="min-w-0 flex-1">
              <Suspense fallback={<div className="h-9" />}>
                <CategoryNav />
              </Suspense>
            </div>
            <div className="hidden shrink-0 items-center lg:flex">
              <a
                href={storefrontContact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryLinkClass}
              >
                Mağazamız
              </a>
              <a href="#iletisim" className={secondaryLinkClass}>
                İletişim
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
