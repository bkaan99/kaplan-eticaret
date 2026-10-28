import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BannerGrid } from "@/components/storefront/banner-grid";
import { ProductGrid } from "@/components/storefront/product-grid";
import { JsonLd } from "@/components/storefront/json-ld";
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
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tree.map((category) => (
        <li key={category.id}>
          <Link
            href={`/kategori/${category.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src={category.imageUrl ?? "/placeholder.svg"}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-primary sm:text-base">
                  {category.name}
                </h3>
                <span className="text-xs text-slate-400">Ürünleri Keşfet</span>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white">
                <ArrowRightIcon width={14} height={14} />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
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
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {eyebrow}
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-slate-900 sm:inline-flex"
        >
          <span>{action.label}</span>
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

function Hero() {
  return (
    <section className="relative overflow-hidden pt-2 pb-8 sm:pt-6 sm:pb-12">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Sol Alan: Hikaye ve Eylem */}
        <div className="flex flex-col items-start gap-5 lg:col-span-6 xl:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-900">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>%100 Doğal Fermente · Taş Tuzu & Meşe Fıçı</span>
          </div>

          <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
            Geleneksel Sabır,{" "}
            <span className="italic text-primary font-normal">Kusursuz Lezzet.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Mevsiminde toplanan en taze yerli mahsuller, büyüklerimizin asırlık tarifleriyle fermente edilir. Koruyucusuz, katkısız, probiyotik dolu çıtır ev turşuları sofranızda.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/ara"
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-8 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b2318] hover:shadow-xl active:translate-y-0"
            >
              <span>Turşuları Keşfet</span>
              <ArrowRightIcon width={16} height={16} />
            </Link>
            <Link
              href="/kategori/hediye-kutulari"
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
            >
              Hediye Kutuları
            </Link>
          </div>

          {/* İstatistik ve Güven Rozetleri */}
          <div className="mt-3 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-slate-100 pt-5">
            <div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-lg sm:text-xl">
                <span>★ 4.9</span>
              </div>
              <p className="text-xs text-slate-500">10.000+ Mutlu Sofra</p>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                %100 Doğal
              </div>
              <p className="text-xs text-slate-500">Koruyucu & Katkısız</p>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                Kırılmaz Koli
              </div>
              <p className="text-xs text-slate-500">Güvenli Ambalaj</p>
            </div>
          </div>
        </div>

        {/* Sağ Alan: Gerçekçi Fotoğrafik Karşılama */}
        <div className="relative lg:col-span-6 xl:col-span-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-2xl shadow-emerald-950/5 lg:aspect-[5/4]">
            <Image
              src="/images/hero/hero-modern.jpg"
              alt="Kaplan Doğal Fermente Gurme Turşular ve Şalgam Suyu"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            {/* Üst Karartma / Işıma */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            {/* Yüzen Rozet 1 */}
            <div className="absolute top-4 right-4 rounded-full border border-white/40 bg-white/85 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur-md">
              🌿 Geleneksel Meşe Fıçı
            </div>

            {/* Yüzen Rozet 2 (Alt) */}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Mevsimin Gözdesi
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  Çıtır Kornişon & Acılı Şalgam
                </p>
              </div>
              <Link
                href="/kategori/klasik-tursular"
                className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-white transition hover:bg-[#0b2318]"
              >
                <span>İncele</span>
                <ArrowRightIcon width={12} height={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "🌿 %100 Doğal Fermantasyon",
    "🥒 Çıtır Kornişon & Ev Usulü Salatalık",
    "🍷 Adana Usulü Acılı Şalgam",
    "🧂 Çankırı Kaya Tuzu & Kaynak Suyu",
    "📦 Kırılmaz Özel Ambalaj Garantisi",
    "⚡ 48 Saatte Kapınızda",
  ];

  return (
    <div
      aria-hidden="true"
      className="full-bleed border-y border-slate-100 bg-slate-50/70 py-3 text-slate-700"
    >
      <div className="animate-marquee flex w-max gap-8 pr-8">
        {[...items, ...items, ...items].map((item, index) => (
          <span
            key={index}
            className="flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-slate-600 whitespace-nowrap"
          >
            {item}
            <span className="text-amber-500 font-bold">✦</span>
          </span>
        ))}
      </div>
    </div>
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
            Fabrikasyon hızlandırıcı yok, koruyucu asitler yok. Her kavanoz, büyüklerimizden öğrendiğimiz asırlık usullerle, kendi doğal fermantasyon sürecinde olgunlaşır.
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
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
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
            <span className="italic text-amber-400 font-normal">sağlık ve lezzet</span>
          </h2>
          <p className="max-w-lg text-sm text-slate-300 sm:text-base leading-relaxed">
            En sevilen çıtır kornişonlar, tombul biberler ve acılı şalgam suyu özel koruyucu kraft kutusunda bir araya geldi. Sofralara samimi bir hediye.
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
      comment: "Kavanozu açtığınız an o çıtırlık ve sarımsak kokusu çocukluğuma götürdü. Asla sirke kokusu genzi yakmıyor, tam kıvamında ev turşusu.",
      stars: 5,
      product: "Ev Usulü Salatalık Turşusu",
    },
    {
      name: "Murat Korkmaz",
      city: "Ankara",
      comment: "Şalgam suyu efsane, acısı tam ayarında ve dibinde yapay tortu yok. Kargo o kadar sağlam paketlenmişti ki straforu açmak 5 dakikamı aldı, tebrikler.",
      stars: 5,
      product: "Adana Acılı Şalgam Suyu",
    },
    {
      name: "Selin Yılmaz",
      city: "İzmir",
      comment: "Tadım kutusunu hediye olarak arkadaşıma yolladım, kutulama ve kavanoz kalitesi çok şık duruyor. Şimdi kendime aile boyu kutu siparişi verdim.",
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
              <span className="font-semibold text-emerald-800">{r.product}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: TruckIcon,
      title: "Ücretsiz Kargo",
      text: `${formatMoney(siteConfig.shipping.freeShippingThreshold)} üzeri siparişlerde`,
    },
    {
      icon: JarIcon,
      title: "Kırılmaz Güvence",
      text: "Hava yastıklı koruyucu ambalaj",
    },
    {
      icon: LeafIcon,
      title: "%100 Katkısız",
      text: "Kimyasal koruyucu ve asit yok",
    },
    {
      icon: ClockIcon,
      title: "Kolay İade",
      text: `${siteConfig.returns.withdrawalPeriodDays} gün içinde koşulsuz iade`,
    },
  ];

  return (
    <section aria-label="Avantajlar" className="border-t border-slate-100 pt-8">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3.5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-primary">
              <Icon width={22} height={22} />
            </span>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          </div>
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

      <Hero />
      <Marquee />

      <section className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="Geleneksel Çeşitler"
          title="Kategorileri Keşfedin"
          action={{ href: "/ara", label: "Tüm Ürünler" }}
        />
        <Suspense fallback={<div className="h-64" />}>
          <CategoryTiles />
        </Suspense>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="En Çok Tercih Edilenler"
          title="Öne Çıkan Gurme Turşular"
          action={{ href: "/ara", label: "Tümünü Gör" }}
        />
        <Suspense
          fallback={<p className="text-slate-400">Yükleniyor...</p>}
        >
          <FeaturedProducts />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <BannerGrid />
      </Suspense>

      <Process />
      <GiftCallout />
      <CustomerReviews />
      <Benefits />
    </div>
  );
}
