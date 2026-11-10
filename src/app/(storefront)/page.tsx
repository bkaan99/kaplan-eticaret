import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BannerGrid } from "@/components/storefront/banner-grid";
import { ProductGrid } from "@/components/storefront/product-grid";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { JsonLd } from "@/components/storefront/json-ld";
import { ArrowRightIcon } from "@/components/storefront/icons";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { formatMoney } from "@/shared/money";
import { absoluteUrl, getSiteUrl } from "@/shared/site-url";
import { getCategoryTree } from "@/modules/catalog/cached";
import {
  getCachedContactSettings,
  getCachedShippingSettings,
} from "@/modules/settings/cached";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import { customPickleService } from "@/modules/custom-pickle/container";
import { maxIngredientsForSize } from "@/modules/custom-pickle/custom-pickle.types";

const HOME_TITLE = "Geleneksel Ev Yapımı Çubuk Turşuları ve Şalgam Suyu";
const HOME_OG_IMAGE = "/images/hero/hero-tursu-kavanozlar.jpg";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: siteConfig.description,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: HOME_TITLE,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    type: "website",
    images: [
      {
        url: HOME_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Doğal Fermente Ev Turşuları`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: siteConfig.description,
    images: [HOME_OG_IMAGE],
  },
};

async function FeaturedProducts() {
  const products = await catalogService.getHomepageProducts(
    8,
    await getRequestPricing(),
  );
  return <ProductGrid products={products} />;
}

async function CategoryTiles() {
  const tree = await getCategoryTree();

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {tree.map((category) => (
        <li key={category.id}>
          <Link
            href={`/kategori/${category.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
          >
            <Image
              src={category.imageUrl ?? "/placeholder.svg"}
              alt={`${category.name} Çeşitleri`}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/15 to-transparent" />
            <h3 className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 text-sm font-bold text-white sm:p-4 sm:text-base">
              {category.name}
              <ArrowRightIcon
                width={16}
                height={16}
                className="shrink-0 transition-transform group-hover:translate-x-1"
              />
            </h3>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function SiteJsonLd() {
  const [url, contact] = await Promise.all([
    Promise.resolve(getSiteUrl()),
    getCachedContactSettings(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["Organization", "Store"],
          name: siteConfig.name,
          url,
          logo: absoluteUrl("/images/logo/kaplan-badge-logo.jpg"),
          image: [
            absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg"),
            absoluteUrl("/images/logo/kaplan-badge-logo.jpg"),
          ],
          description: siteConfig.description,
          email: contact.email,
          telephone: storefrontContact.phoneTel,
          priceRange: "₺₺",
          address: {
            "@type": "PostalAddress",
            ...storefrontContact.postalAddress,
          },
          geo: {
            "@type": "GeoCoordinates",
            ...storefrontContact.geo,
          },
          hasMap: storefrontContact.mapsUrl,
          sameAs: [
            storefrontContact.instagramUrl,
            storefrontContact.trendyolUrl,
          ],
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [...storefrontContact.openingHours.daysOfWeek],
            opens: storefrontContact.openingHours.opens,
            closes: storefrontContact.openingHours.closes,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${url}/ara?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-brand-dark"
        >
          {action.label}
          <ArrowRightIcon
            width={15}
            height={15}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      ) : null}
    </div>
  );
}

const BUILDER_STEPS = [
  "Bidonunu seç",
  "Sebze ve baharatları ekle",
  "Salamura ve acılığa karar ver",
];

/** "Kendi Turşunu Yap" bandı: boyutlar ve malzeme sınırları gerçek ürün verisinden gelir. */
async function BuilderBand() {
  const pricing = await getRequestPricing();
  const data = await customPickleService.getBuilder({
    customerGroupId: pricing.customerGroupId,
  });
  if (!data || data.sizes.length === 0) return null;

  return (
    <section className="rounded-3xl bg-primary p-6 text-white sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div>
          <span className="text-[11px] font-bold tracking-[0.14em] text-amber-300 uppercase">
            Sana özel bidon
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Turşunu kendin tasarla
          </h2>
          <ol className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {BUILDER_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-brand-dark">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-3">
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {data.sizes.map((size) => (
              <li
                key={size.variantId}
                className="flex flex-col items-center rounded-xl bg-white px-3 py-3 text-center text-primary sm:px-6"
              >
                <span className="text-sm font-bold sm:text-base">
                  {size.label.replace(/\s*bidon$/i, "")}
                </span>
                <span className="text-[11px] text-slate-500">
                  {maxIngredientsForSize(size.weightGram)} malzeme
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/kendi-tursunu-yap"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-400 px-7 text-sm font-bold text-brand-dark transition hover:bg-amber-300"
          >
            Bidonunu hazırla
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-slate-50/70 p-8 sm:p-12 lg:p-14">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-center">
        <div className="flex flex-col gap-3 lg:col-span-5">
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Nasıl Üretiyoruz?
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            İyi turşunun sırrı sabır ve saflıktır
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Fabrikasyon hızlandırıcı yok, koruyucu asitler yok. Her kavanoz,
            büyüklerimizden öğrendiğimiz asırlık usullerle, kendi doğal
            fermantasyon sürecinde olgunlaşır.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3 lg:col-span-7">
          {[
            {
              num: "01",
              title: "Taze Hasat",
              desc: "Yerli tohum sebzeler mevsiminde, sabah serinliğinde tek tek seçilerek toplanır.",
            },
            {
              num: "02",
              title: "Taş Tuzu & Sarımsak",
              desc: "Çankırı kaya tuzu, doğal kaynak suyu ve Taşköprü sarımsağıyla elle kavanozlanır.",
            },
            {
              num: "03",
              title: "Doğal Bekleyiş",
              desc: "Serin mahzenlerde en az 45 gün boyunca kendi kendine fermente olmaya bırakılır.",
            },
          ].map((item) => (
            <div
              key={item.num}
              className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-primary/30"
            >
              <span className="font-display text-3xl font-bold text-amber-500">
                {item.num}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftCallout() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0b2318] text-white">
      <div className="grid md:grid-cols-12 items-center">
        <div className="flex flex-col items-start gap-4 p-8 sm:p-12 lg:p-14 md:col-span-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <span>🎁</span> Gurme Hediye Kutuları
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-5xl leading-tight">
            Sevdiklerinize bir kutu dolusu{" "}
            <span className="italic text-amber-400 font-normal">
              sağlık ve lezzet
            </span>
          </h2>
          <p className="max-w-lg text-sm text-slate-300 sm:text-base leading-relaxed">
            En sevilen çıtır kornişonlar, tombul biberler ve acılı şalgam suyu
            özel koruyucu kraft kutusunda bir araya geldi. Sofralara samimi bir
            hediye.
          </p>
          <div className="pt-2">
            <Link
              href="/kategori/hediye-kutulari"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-amber-400 px-7 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              <span>Kutuları İncele</span>
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[300px] w-full md:col-span-5 md:h-full bg-slate-900">
          <Image
            src="/images/urunler/aile-boyu-tursu-kutusu.jpg"
            alt="Kaplan Gurme Hediye Kutusu"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function CustomerReviews() {
  const reviews = [
    {
      name: "Elif Demir",
      city: "İstanbul",
      comment:
        "Kavanozu açtığınız an o çıtırlık ve sarımsak kokusu çocukluğuma götürdü. Asla sirke kokusu genzi yakmıyor, tam kıvamında ev turşusu.",
      stars: 5,
      product: "Ev Usulü Salatalık Turşusu",
    },
    {
      name: "Murat Korkmaz",
      city: "Ankara",
      comment:
        "Şalgam suyu efsane, acısı tam ayarında ve dibinde yapay tortu yok. Kargo o kadar sağlam paketlenmişti ki straforu açmak 5 dakikamı aldı, tebrikler.",
      stars: 5,
      product: "Adana Acılı Şalgam Suyu",
    },
    {
      name: "Selin Yılmaz",
      city: "İzmir",
      comment:
        "Tadım kutusunu hediye olarak arkadaşıma yolladım, kutulama ve kavanoz kalitesi çok şık duruyor. Şimdi kendime aile boyu kutu siparişi verdim.",
      stars: 5,
      product: "Turşu Tadım Kutusu",
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Mutlu Müşteriler
        </span>
        <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
          Sofralardan gelen samimi yorumlar
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs hover:border-slate-200 transition"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                {"★".repeat(r.stars)}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                &ldquo;{r.comment}&rdquo;
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div>
                <span className="font-bold text-slate-900">{r.name}</span>
                <span className="text-slate-400"> · {r.city}</span>
              </div>
              <span className="font-semibold text-emerald-800">
                {r.product}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function Faq() {
  const shipping = await getCachedShippingSettings();
  const items = [
    {
      q: "Turşularınızda koruyucu veya katkı maddesi var mı?",
      a: "Hayır. Turşularımız kaya tuzu, kaynak suyu ve doğal fermantasyonla hazırlanır; kimyasal koruyucu kullanılmaz.",
    },
    {
      q: "Turşuyu açtıktan sonra nasıl saklamalıyım?",
      a: "Açılan kavanozu buzdolabında saklayın, ürünü temiz ve kuru bir kaşıkla alın, turşunun suyunun üzerini örtmesine dikkat edin.",
    },
    {
      q: "Kargo ücreti ne kadar?",
      a: `${formatMoney(shipping.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde ücret ödeme adımında gösterilir.`,
    },
    {
      q: "Ürünüm hasarlı gelirse ne yapmalıyım?",
      a: `Ürünün fotoğrafıyla birlikte ${storefrontContact.phone} numarasından bize ulaşın. Yasal cayma süresi ${siteConfig.returns.withdrawalPeriodDays} gündür.`,
    },
    {
      q: "Kendi turşumu nasıl hazırlatabilirim?",
      a: "Kendi Turşunu Yap sayfasından bidon boyutunu seçip malzemeleri ekleyin, salamura ve acılığı belirleyin; siparişinizi tarifinize göre hazırlayalım.",
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }}
      />
      <SectionHeading title="Sıkça Sorulan Sorular" />
      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {items.map((item) => (
          <details key={item.q} className="group px-5 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-slate-900 sm:text-base [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="shrink-0 text-xl leading-none text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-slate-600">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <Suspense fallback={null}>
        <SiteJsonLd />
      </Suspense>

      <HeroSlider />

      <section className="flex flex-col gap-6">
        <SectionHeading
          title="Turşu Çeşitleri"
          action={{ href: "/ara", label: "Tümünü gör" }}
        />
        <Suspense fallback={<div className="h-64" />}>
          <CategoryTiles />
        </Suspense>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading
          title="En Sevilenler"
          action={{ href: "/ara", label: "Tümünü gör" }}
        />
        <Suspense fallback={<p className="text-slate-400">Yükleniyor...</p>}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <BuilderBand />
      </Suspense>

      <Suspense fallback={null}>
        <BannerGrid />
      </Suspense>

      <Process />
      <GiftCallout />
      <CustomerReviews />
      <Suspense fallback={null}>
        <Faq />
      </Suspense>
    </div>
  );
}
