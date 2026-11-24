import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/storefront/json-ld";
import { TurnstileWidget } from "@/components/storefront/turnstile-widget";
import { TruckIcon } from "@/components/storefront/icons";
import { siteConfig } from "@/config/site.config";
import { absoluteUrl } from "@/shared/site-url";
import { WholesaleForm } from "./wholesale-form";

const PAGE_TITLE = "Toptan Fiyat Teklifi";
const PAGE_DESCRIPTION = `${siteConfig.name} toptan fiyat teklifi formu. Restoran, otel, market ve şarküteriler için Çubuk turşusu toptan alım talebi oluşturun.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/toptan") },
  openGraph: {
    title: `${PAGE_TITLE} | ${siteConfig.name}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/toptan"),
    type: "website",
    images: [
      {
        url: absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Toptan Fiyat Teklifi`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | ${siteConfig.name}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg")],
  },
};

export default function WholesaleQuotePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
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
              item: absoluteUrl("/toptan"),
            },
          ],
        }}
      />

      <nav aria-label="Sayfa yolu" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Ana sayfa
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>/</span>
            <span className="text-foreground">Toptan</span>
          </li>
        </ol>
      </nav>

      <header className="flex flex-col items-start gap-4 text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <TruckIcon width={14} height={14} />
          <span>Toptan & kurumsal tedarik</span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Toptan Fiyat Teklifi Alın
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          İşletmeniz için en taze ve lezzetli Çubuk turşularımızdan toptan fiyat
          teklifi almak için aşağıdaki formu doldurunuz. Restoran, otel, market
          ve şarküterilere düzenli sevkiyat yapıyoruz.
        </p>
      </header>

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-xs sm:p-8">
        <WholesaleForm captcha={<TurnstileWidget />} />
      </section>

      <p className="text-center text-sm text-slate-500">
        Bireysel sipariş için{" "}
        <Link href="/ara" className="font-semibold text-primary hover:underline">
          ürünlere göz atın
        </Link>{" "}
        veya{" "}
        <Link
          href="/iletisim"
          className="font-semibold text-primary hover:underline"
        >
          bize yazın
        </Link>
        .
      </p>
    </div>
  );
}
