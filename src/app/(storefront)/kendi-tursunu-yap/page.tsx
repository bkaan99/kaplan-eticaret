import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { HeroTitle } from "@/components/storefront/hero-scene";
import { Reveal } from "@/components/motion/motion";
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

  return <Builder sizes={data.sizes} ingredients={data.ingredients} />;
}

export default function CustomPicklePage() {
  return (
    <div className="flex flex-col gap-10">
      <Breadcrumbs
        items={[
          { name: "Ana sayfa", href: "/" },
          { name: "Kendi Turşunu Yap" },
        ]}
      />
      <header className="flex max-w-2xl flex-col gap-4">
        <Reveal>
          <span className="text-xs font-semibold tracking-[0.25em] text-brand-leaf uppercase">
            Senin tarifin, bizim emeğimiz
          </span>
        </Reveal>
        <HeroTitle
          className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-brand-dark sm:text-6xl"
          words={[
            { text: "Kendi" },
            { text: "turşunu", accent: true },
            { text: "yap" },
          ]}
        />
        <Reveal delay={0.3}>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Bidonunu seç, sevdiğin sebzeleri ve baharatları ekle; salamurasına
            ve acılığına sen karar ver. Senin için hazırlayıp kapına gönderelim.
          </p>
        </Reveal>
      </header>
      <Suspense
        fallback={<p className="text-muted-foreground">Yükleniyor...</p>}
      >
        <BuilderContent />
      </Suspense>
    </div>
  );
}
