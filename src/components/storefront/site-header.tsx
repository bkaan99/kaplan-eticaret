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
import { HeartIcon, SearchIcon } from "./icons";
import { Logo } from "./logo";

async function CategoryNav() {
  await connection();
  const [tree, extra] = await Promise.all([
    getCategoryTree(),
    getCachedMenu("header"),
  ]);

  return (
    <nav
      aria-label="Kategoriler"
      className="-mx-4 flex gap-x-1 overflow-x-auto px-4 py-2 text-sm font-medium whitespace-nowrap [scrollbar-width:none]"
    >
      <Link
        href="/ara"
        className="rounded-full px-4 py-1.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        Tüm Ürünler
      </Link>
      <Link
        href="/kendi-tursunu-yap"
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 font-semibold text-amber-900 transition-colors hover:bg-amber-200"
      >
        <span aria-hidden="true">✦</span>
        Kendi Turşunu Yap
      </Link>
      {tree.map((category) => (
        <Link
          key={category.id}
          href={`/kategori/${category.slug}`}
          className="rounded-full px-4 py-1.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
      {extra.map((item) => (
        <Link
          key={`${item.label}-${item.url}`}
          href={item.url}
          className="rounded-full px-4 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          {item.label}
        </Link>
      ))}
    </nav>
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

const iconLinkClass =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900";

export function SiteHeader() {
  return (
    <header className="relative z-40 md:sticky md:top-0">
      {/* Üst Duyuru Bandı */}
      <div className="bg-[#0b2318] text-white">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs tracking-wide">
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          <span>
            {formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri siparişlerde <strong>ücretsiz kargo</strong> & kırılmaz ambalaj güvencesi
          </span>
        </p>
      </div>

      {/* Ana Başlık Alanı */}
      <div className="border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-6 py-3.5">
            <Logo />
            <SearchForm className="hidden max-w-md flex-1 md:block" />
            <div className="flex items-center gap-1.5">
              {isFeatureEnabled("wishlist") ? (
                <Link href="/favoriler" className={iconLinkClass}>
                  <HeartIcon className="text-slate-600" />
                  <span className="sr-only lg:not-sr-only text-xs">Favoriler</span>
                </Link>
              ) : null}
              <Suspense
                fallback={<span className={iconLinkClass}>&nbsp;</span>}
              >
                <AccountLink className={iconLinkClass} />
              </Suspense>
              <Suspense fallback={<span className={iconLinkClass}>Sepet</span>}>
                <CartBadge />
              </Suspense>
            </div>
          </div>
          <SearchForm className="pb-3 md:hidden" />
          <div className="border-t border-slate-100/80">
            <Suspense fallback={<div className="h-10" />}>
              <CategoryNav />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
