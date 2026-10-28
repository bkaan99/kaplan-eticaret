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
      className="-mx-4 flex gap-x-7 overflow-x-auto px-4 text-sm font-medium whitespace-nowrap [scrollbar-width:none]"
    >
      <Link
        href="/ara"
        className="border-b-2 border-transparent py-3 text-foreground/80 transition-colors hover:border-accent hover:text-primary"
      >
        Tüm ürünler
      </Link>
      {tree.map((category) => (
        <Link
          key={category.id}
          href={`/kategori/${category.slug}`}
          className="border-b-2 border-transparent py-3 text-foreground/80 transition-colors hover:border-accent hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
      {extra.map((item) => (
        <Link
          key={`${item.label}-${item.url}`}
          href={item.url}
          className="border-b-2 border-transparent py-3 text-muted-foreground transition-colors hover:border-accent hover:text-primary"
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
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        type="search"
        placeholder="Turşu, şalgam, hediye kutusu ara…"
        aria-label="Ürün ara"
        className="h-11 w-full rounded-full border border-border bg-white pr-4 pl-11 text-sm transition outline-none placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </form>
  );
}

const iconLinkClass =
  "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-primary";

export function SiteHeader() {
  return (
    <header className="relative z-40 md:sticky md:top-0">
      <div className="bg-brand-dark text-brand-cream">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs tracking-wide">
          <span className="text-accent">●</span>{" "}
          {formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri
          siparişlerde kargo ücretsiz
        </p>
      </div>
      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-6 py-3">
            <Logo />
            <SearchForm className="hidden max-w-md flex-1 md:block" />
            <div className="flex items-center gap-1">
              {isFeatureEnabled("wishlist") ? (
                <Link href="/favoriler" className={iconLinkClass}>
                  <HeartIcon />
                  <span className="sr-only lg:not-sr-only">Favoriler</span>
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
          <Suspense fallback={<div className="h-11" />}>
            <CategoryNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
