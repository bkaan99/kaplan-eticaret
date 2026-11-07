import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { JsonLd } from "@/components/storefront/json-ld";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { customPickleService } from "@/modules/custom-pickle/container";
import { absoluteUrl } from "@/shared/site-url";
import { Builder } from "./builder";

export const metadata: Metadata = {
  title: "Kendi Turşunu Yap",
  description:
    "Bidon boyutunu seç, sevdiğin sebzeleri ve baharatları ekle, salamurasına ve acılığına sen karar ver. Senin tarifinle hazırlayıp gönderelim.",
  alternates: { canonical: absoluteUrl("/kendi-tursunu-yap") },
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
              name: "Kendi Turşunu Yap",
              item: absoluteUrl("/kendi-tursunu-yap"),
            },
          ],
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Ana sayfa", href: "/" },
          { name: "Kendi Turşunu Yap" },
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
