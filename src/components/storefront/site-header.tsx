import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedMenu } from "@/modules/content/cached";
import { formatMoney } from "@/shared/money";
import { AccountLink } from "./account-link";
import { CartBadge } from "./cart-badge";
import { HeaderNav, MobileSearch } from "./header-nav";
import { HeartIcon, SearchIcon } from "./icons";
import { Logo } from "./logo";

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
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
      <input
        name="q"
        type="search"
        placeholder="Çıtır kornişon, acılı şalgam, hediye kutusu ara…"
        aria-label="Ürün ara"
        className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 pr-4 pl-10 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/10"
      />
    </form>
  );
}

function BuilderLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/kendi-tursunu-yap"
      className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-amber-500/20 transition hover:bg-amber-300 ${className}`}
    >
      <span
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:rotate-90"
      >
        ✦
      </span>
      Kendi Turşunu Yap
    </Link>
  );
}

const iconLinkClass =
  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900";

export function SiteHeader() {
  return (
    <header className="relative z-40 md:sticky md:top-0">
      {/* Üst Duyuru Bandı */}
      <div className="bg-[#0b2318] text-white">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs tracking-wide">
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          <span>
            {formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri
            siparişlerde <strong>ücretsiz kargo</strong> & kırılmaz ambalaj
            güvencesi
          </span>
        </p>
      </div>

      {/* Ana Başlık Alanı */}
      <div className="relative border-b border-slate-100 bg-white/95 backdrop-blur-md">
        {/* Satır 1: logo · arama (tam ortada) · hesap ve sepet */}
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr] items-center gap-4 px-4 md:grid-cols-[1fr_minmax(0,30rem)_1fr]">
          <div className="justify-self-start whitespace-nowrap">
            <Logo />
          </div>
          <SearchForm className="hidden w-full md:block" />
          <div className="flex items-center gap-1 justify-self-end">
            <MobileSearch />
            {isFeatureEnabled("wishlist") ? (
              <Link
                href="/favoriler"
                className={iconLinkClass}
                aria-label="Favoriler"
              >
                <HeartIcon className="text-slate-600" />
                <span className="sr-only xl:not-sr-only">Favoriler</span>
              </Link>
            ) : null}
            <Suspense fallback={<span className={iconLinkClass}>&nbsp;</span>}>
              <AccountLink className={iconLinkClass} />
            </Suspense>
            <Suspense fallback={<span className={iconLinkClass}>Sepet</span>}>
              <CartBadge />
            </Suspense>
          </div>
        </div>

        {/* Satır 2: kategoriler ortada, öne çıkan bağlantı sağda */}
        <div className="border-t border-slate-100/80">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 xl:grid xl:grid-cols-[1fr_auto_1fr]">
            <span aria-hidden="true" className="hidden xl:block" />
            <BuilderLink className="xl:hidden" />
            <div className="min-w-0 flex-1">
              <Suspense fallback={<div className="h-9" />}>
                <CategoryNav />
              </Suspense>
            </div>
            <div className="hidden justify-self-end xl:block">
              <BuilderLink />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
