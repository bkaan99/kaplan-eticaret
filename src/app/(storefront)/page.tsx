import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BannerGrid } from "@/components/storefront/banner-grid";
import { ProductGrid } from "@/components/storefront/product-grid";
import { JsonLd } from "@/components/storefront/json-ld";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion";
import { HeroScene, HeroTitle } from "@/components/storefront/hero-scene";
import {
  ArrowRightIcon,
  ClockIcon,
  JarIcon,
  LeafIcon,
  TruckIcon,
} from "@/components/storefront/icons";
import { siteConfig } from "@/config/site.config";
import { formatMoney } from "@/shared/money";
import { getSiteUrl } from "@/shared/site-url";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";

async function FeaturedProducts() {
  await connection();
  const products = await catalogService.getHomepageProducts(
    8,
    await getRequestPricing(),
  );
  return <ProductGrid products={products} />;
}

async function CategoryTiles() {
  await connection();
  const tree = await getCategoryTree();

  return (
    <Stagger as="ul" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tree.map((category) => (
        <StaggerItem as="li" key={category.id}>
          <Link
            href={`/kategori/${category.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src={category.imageUrl ?? "/placeholder.svg"}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-4 sm:p-5">
              <span className="font-display text-lg font-semibold text-foreground sm:text-xl">
                {category.name}
              </span>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRightIcon width={16} height={16} />
              </span>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

async function SiteJsonLd() {
  await connection();
  const url = getSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url,
          email: siteConfig.contact.email,
          telephone: siteConfig.contact.phone,
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
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <Reveal className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-[0.25em] text-brand-leaf uppercase">
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-primary sm:inline-flex"
        >
          {action.label}
          <ArrowRightIcon
            width={16}
            height={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      ) : null}
    </Reveal>
  );
}

function Hero() {
  return (
    <section className="full-bleed relative -mt-6 overflow-hidden bg-muted">
      {/* Arka plan dokusu */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(47,82,51,.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.05fr_1fr] md:py-20 lg:py-24">
        <Stagger
          onMount
          stagger={0.12}
          className="flex flex-col items-start gap-6"
        >
          <StaggerItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <LeafIcon width={14} height={14} />
              Geleneksel tarif · Doğal fermantasyon
            </span>
          </StaggerItem>
          <HeroTitle
            className="font-display text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-brand-dark sm:text-6xl lg:text-7xl"
            words={[
              { text: "Bahçeden" },
              { text: "kavanoza," },
              { text: "sabırla", accent: true },
              { text: "olgunlaşan" },
              { text: "lezzet" },
            ]}
          />
          <StaggerItem>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mevsiminde toplanan sebzeler, taş tuzu ve kaynak suyuyla kurulur;
              acele etmeden, kendi zamanında olgunlaşır. Sofranıza ev usulü
              turşu tadı getiriyoruz.
            </p>
          </StaggerItem>
          <StaggerItem className="flex flex-wrap gap-3">
            <Link
              href="/ara"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl active:translate-y-0"
            >
              Turşuları keşfet
              <ArrowRightIcon
                width={16}
                height={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/kategori/hediye-kutulari"
              className="inline-flex h-12 items-center rounded-full border border-primary/25 bg-white/60 px-7 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-white"
            >
              Hediye kutuları
            </Link>
          </StaggerItem>
          <StaggerItem className="mt-2 w-full max-w-md">
            <dl className="grid grid-cols-3 gap-4 border-t border-primary/10 pt-6">
              {[
                ["Katkısız", "Koruyucu yok"],
                ["Ev usulü", "Elde doldurulur"],
                ["Özenli", "Kırılmaz paket"],
              ].map(([title, text]) => (
                <div key={title} className="flex flex-col gap-0.5">
                  <dt className="font-display text-lg font-semibold text-brand-dark">
                    {title}
                  </dt>
                  <dd className="text-xs text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </StaggerItem>
        </Stagger>

        <HeroScene />
      </div>
    </section>
  );
}

const MARQUEE_ITEMS = [
  "Ev usulü tarifler",
  "Doğal fermantasyon",
  "Acılı şalgam suyu",
  "Taş tuzu",
  "Mevsim sebzeleri",
  "Hediye kutuları",
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      aria-hidden="true"
      className="full-bleed -mt-20 overflow-hidden bg-primary py-4 text-primary-foreground"
    >
      <div className="animate-marquee flex w-max gap-10 pr-10">
        {[...items, ...items].map((item, index) => (
          <span
            key={index}
            className="flex items-center gap-10 font-display text-lg whitespace-nowrap italic"
          >
            {item}
            <span className="text-accent not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Seçim",
    text: "Sebzeler mevsiminde, en taze hâlinde toplanır ve tek tek ayıklanır.",
  },
  {
    title: "Kurulum",
    text: "Taş tuzu, kaynak suyu ve ev usulü baharatla kavanozlara elde dizilir.",
  },
  {
    title: "Bekleme",
    text: "Acele etmeden, serin mahzende kendi zamanında olgunlaşmaya bırakılır.",
  },
];

function Process() {
  return (
    <Reveal className="grid gap-10 rounded-[2rem] border border-border bg-white p-8 sm:p-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.25em] text-brand-leaf uppercase">
          Nasıl yapıyoruz?
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          İyi turşunun sırrı sabırdır
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Hızlandırıcı yok, kısayol yok. Her kavanoz, büyüklerimizden
          öğrendiğimiz tarifle hazırlanır.
        </p>
      </div>
      <Stagger as="ol" stagger={0.15} className="grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <StaggerItem as="li" key={step.title} className="flex flex-col gap-3">
            <span className="font-display text-5xl font-semibold text-accent">
              0{index + 1}
            </span>
            <h3 className="font-display text-xl font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.text}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </Reveal>
  );
}

function GiftCallout() {
  return (
    <Reveal className="relative grid overflow-hidden rounded-[2rem] bg-brand-dark text-brand-cream md:grid-cols-2">
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-brand-leaf/30 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-5 p-8 sm:p-12">
        <span className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
          Hediye kutuları
        </span>
        <h2 className="font-display text-3xl leading-tight font-semibold sm:text-5xl">
          Sevdiklerinize bir kutu dolusu{" "}
          <em className="font-medium text-accent italic">ev lezzeti</em>
        </h2>
        <p className="max-w-md leading-relaxed text-brand-cream/75">
          En sevilen turşularımızı bir araya getirdik. Özenle paketlenmiş tadım
          ve aile kutularıyla hem sofraya hem gönüllere.
        </p>
        <Link
          href="/kategori/hediye-kutulari"
          className="group mt-2 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-brand-dark transition hover:bg-[#e9bb3c]"
        >
          Kutuları incele
          <ArrowRightIcon
            width={16}
            height={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
      <div className="group relative min-h-72 overflow-hidden bg-[#efeadb]">
        <Image
          src="/images/urunler/aile-boyu-tursu-kutusu.svg"
          alt="Kaplan turşu hediye kutusu"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain p-6 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2"
        />
      </div>
    </Reveal>
  );
}

function Benefits() {
  const items = [
    {
      icon: TruckIcon,
      title: "Ücretsiz kargo",
      text: `${formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri siparişlerde`,
    },
    {
      icon: JarIcon,
      title: "Kırılmaz paketleme",
      text: "Her kavanoz ayrı ayrı korunur",
    },
    {
      icon: LeafIcon,
      title: "Katkısız",
      text: "Koruyucu ve renklendirici yok",
    },
    {
      icon: ClockIcon,
      title: "Kolay iade",
      text: `${siteConfig.returns.withdrawalPeriodDays} gün içinde iade hakkı`,
    },
  ];

  return (
    <section aria-label="Avantajlar">
      <Stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <StaggerItem key={title} className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20">
      <Suspense fallback={null}>
        <SiteJsonLd />
      </Suspense>

      <Hero />
      <Marquee />

      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Kavanoz kavanoz"
          title="Kategoriler"
          action={{ href: "/ara", label: "Tüm ürünler" }}
        />
        <Suspense fallback={<div className="h-64" />}>
          <CategoryTiles />
        </Suspense>
      </section>

      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Çok satanlar"
          title="Öne çıkan ürünler"
          action={{ href: "/ara", label: "Tümünü gör" }}
        />
        <Suspense
          fallback={<p className="text-muted-foreground">Yükleniyor...</p>}
        >
          <FeaturedProducts />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <BannerGrid />
      </Suspense>

      <Process />
      <GiftCallout />
      <Benefits />
    </div>
  );
}
