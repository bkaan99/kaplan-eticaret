import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { JsonLd } from "@/components/storefront/json-ld";
import { siteConfig } from "@/config/site.config";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { customPickleService } from "@/modules/custom-pickle/container";
import { absoluteUrl } from "@/shared/site-url";
import { Builder } from "./builder";

const PAGE_TITLE = "Kendi Turşunu Yap";
const PAGE_DESCRIPTION =
  "Bidon boyutunu seç, sevdiğin sebzeleri ve baharatları ekle, salamurasına ve acılığına sen karar ver. Senin tarifinle hazırlayıp gönderelim.";
const PAGE_OG_IMAGE = "/images/hero/hero-tursu-kavanozlar.webp";
const PAGE_URL = absoluteUrl("/kendi-tursunu-yap");

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: PAGE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${PAGE_TITLE} | ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [PAGE_OG_IMAGE],
  },
};

async function BuilderContent() {
  await connection();
  const pricing = await getRequestPricing();
  const data = await customPickleService.getBuilder({
    customerGroupId: pricing.customerGroupId,
  });

  if (!data || data.ingredients.length === 0) {
    return (
      <div className="rounded-[2rem] border border-border bg-white p-10 text-center">
        <p className="font-display text-2xl font-semibold">Çok yakında</p>
        <p className="mt-2 text-muted-foreground">
          Kendi turşunu yap bidonları hazırlanıyor. Bu arada{" "}
          <Link href="/ara" className="font-semibold text-primary underline">
            hazır turşularımıza
          </Link>{" "}
          göz atabilirsiniz.
        </p>
      </div>
    );
  }

  if (pricing.pricesVisible === false) {
    return (
      <p className="rounded-2xl border border-border bg-white p-6 text-sm">
        Sipariş vermek için{" "}
        <Link href="/giris" className="underline">
          giriş yapın
        </Link>
        .
      </p>
    );
  }

  return (
    <Builder
      sizes={data.sizes}
      ingredients={data.ingredients}
      brines={data.brines}
      spices={data.spices}
    />
  );
}

export default function CustomPicklePage() {
  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ana Sayfa",
              item: absoluteUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: PAGE_TITLE,
              item: PAGE_URL,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          url: PAGE_URL,
          serviceType: "Özel turşu hazırlama",
          provider: {
            "@type": "Organization",
            name: siteConfig.name,
            url: absoluteUrl("/"),
          },
          areaServed: {
            "@type": "Country",
            name: "TR",
          },
          image: absoluteUrl(PAGE_OG_IMAGE),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Ana sayfa", href: "/" },
          { name: PAGE_TITLE },
        ]}
      />
      <header className="flex max-w-2xl flex-col gap-2">
        <span className="text-xs font-bold tracking-[0.14em] text-brand-leaf uppercase">
          Senin tarifin
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Kendi turşunu yap
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Bidon boyutunu seç, sevdiğin malzemeleri ekle, oranlarını ayarla;
          salamura ve acılık senin kararın. Kaplan ustaları senin tarifinle
          hazırlayıp kapına göndersin.
        </p>
      </header>
      <Suspense
        fallback={<p className="text-muted-foreground">Yükleniyor...</p>}
      >
        <BuilderContent />
      </Suspense>
    </div>
  );
}
