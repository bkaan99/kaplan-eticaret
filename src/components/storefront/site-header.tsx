import Link from "next/link";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedMenu } from "@/modules/content/cached";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { formatMoney } from "@/shared/money";
import { HeaderNav } from "./header-nav";
import { BidonThumb, HeartIcon, TruckIcon } from "./icons";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";
import { StorefrontShellActions } from "./storefront-shell";

async function MobileNavContainer() {
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
        {/* Satır 1: logo (sol) · arama (orta) · aksiyonlar (sağ). Tam genişlik;
            dar ekranda arama alt satıra iner. */}
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,40rem)_minmax(0,1fr)] md:gap-x-6 lg:px-8 2xl:px-12">
          <div className="justify-self-start">
            <Logo showBadge />
          </div>
          <SearchForm className="order-last col-span-2 w-full min-w-0 md:order-none md:col-span-1" />
          <div className="flex shrink-0 items-center gap-0.5 justify-self-end sm:gap-1">
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
            {/* Sepet/hesap istemci kabuğu — HTML edge cache için SSR kişiselleştirme yok */}
            <div className="flex items-center gap-0.5 sm:gap-1 max-sm:[&>div:first-child]:hidden">
              <StorefrontShellActions accountClassName={iconLinkClass} />
            </div>
            <Suspense fallback={<div className="h-10 w-10 md:hidden" />}>
              <MobileNavContainer />
            </Suspense>
          </div>
        </div>

        {/* Satır 2: öne çıkan bağlantı · kategoriler · mağaza ve iletişim */}
        <div className="hidden border-t border-slate-100 md:block">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 py-1.5 lg:px-8 2xl:px-12">
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
