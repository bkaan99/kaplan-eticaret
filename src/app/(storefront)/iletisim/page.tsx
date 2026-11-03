import type { Metadata } from "next";
import { JsonLd } from "@/components/storefront/json-ld";
import {
  ArrowRightIcon,
  ClockIcon,
  LeafIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/storefront/icons";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { absoluteUrl, getSiteUrl } from "@/shared/site-url";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "İletişim & Fabrika Satış Mağazası",
  description: `${siteConfig.name} iletişim bilgileri, telefon, WhatsApp destek hattı, fabrika satış mağazası adresi ve iletişim formu.`,
  alternates: { canonical: absoluteUrl("/iletisim") },
  openGraph: {
    title: `İletişim & Fabrika Satış Mağazası | ${siteConfig.name}`,
    description: `${siteConfig.name} iletişim bilgileri, telefon, WhatsApp destek hattı, fabrika satış mağazası adresi ve iletişim formu.`,
    url: absoluteUrl("/iletisim"),
    type: "website",
    images: [
      {
        url: absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} İletişim & Fabrika Satış Mağazası`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `İletişim & Fabrika Satış Mağazası | ${siteConfig.name}`,
    description: `${siteConfig.name} telefon, WhatsApp, adres ve iletişim formu.`,
    images: [absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg")],
  },
};

export default async function ContactPage() {
  const contact = await getCachedContactSettings();
  const siteUrl = getSiteUrl();

  const phoneDisplay = contact.phone || storefrontContact.phone;
  const phoneTel = contact.phone
    ? contact.phone.replace(/\s/g, "")
    : storefrontContact.phoneTel;

  const whatsappDisplay = contact.whatsapp || storefrontContact.phone;
  const whatsappHref = `https://wa.me/${(
    contact.whatsapp || storefrontContact.phoneTel
  ).replace(/\D/g, "")}?text=${encodeURIComponent(
    "Merhaba, Kaplan Turşu ürünleri hakkında bilgi almak istiyorum.",
  )}`;

  const emailDisplay = contact.email || siteConfig.contact.email;
  const addressDisplay = contact.address || storefrontContact.address;
  const workingHours = contact.workingHours || storefrontContact.workingHours;

  return (
    <>
      {/* Schema.org BreadcrumbList */}
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
              name: "İletişim",
              item: absoluteUrl("/iletisim"),
            },
          ],
        }}
      />

      {/* Schema.org ContactPage & LocalBusiness */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `İletişim - ${siteConfig.name}`,
          url: absoluteUrl("/iletisim"),
          mainEntity: {
            "@type": ["Store", "LocalBusiness"],
            name: siteConfig.name,
            telephone: phoneDisplay,
            email: emailDisplay,
            priceRange: "₺₺",
            logo: absoluteUrl("/images/logo/kaplan-badge-logo.jpg"),
            image: [
              absoluteUrl("/images/hero/hero-tursu-kavanozlar.jpg"),
              absoluteUrl("/images/logo/kaplan-badge-logo.jpg"),
            ],
            address: {
              "@type": "PostalAddress",
              ...storefrontContact.postalAddress,
            },
            geo: {
              "@type": "GeoCoordinates",
              ...storefrontContact.geo,
            },
            hasMap: storefrontContact.mapsUrl,
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [...storefrontContact.openingHours.daysOfWeek],
              opens: storefrontContact.openingHours.opens,
              closes: storefrontContact.openingHours.closes,
            },
            sameAs: [
              storefrontContact.instagramUrl,
              storefrontContact.trendyolUrl,
            ],
          },
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 py-4 sm:py-8">
        {/* Üst Başlık & Açıklama */}
        <div className="flex flex-col items-center text-center">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <LeafIcon width={13} height={13} className="text-emerald-700" />
            <span>Doğrudan Üreticiden</span>
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            İletişim & Fabrika Satış Mağazası
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Geleneksel ev usulü Çubuk turşularımız, toptan/restoran sipariş
            talepleriniz veya aklınıza takılan tüm sorular için dilediğiniz
            kanaldan bizimle iletişime geçebilirsiniz.
          </p>
        </div>

        {/* 4 Ana İletişim Kartı */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1: Telefon */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-200/60">
                <PhoneIcon width={20} height={20} />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Telefon ile İletişim
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Haftanın her günü müşteri temsilcimizle görüşebilirsiniz.
              </p>
            </div>
            <a
              href={`tel:${phoneTel}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
            >
              <span>{phoneDisplay}</span>
              <ArrowRightIcon width={14} height={14} />
            </a>
          </div>

          {/* 2: WhatsApp */}
          <div className="flex flex-col justify-between rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-6 shadow-xs transition hover:border-emerald-300 hover:shadow-md">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25d366] text-white shadow-xs">
                <WhatsAppIcon width={22} height={22} />
              </span>
              <h2 className="mt-4 text-base font-bold text-emerald-950">
                WhatsApp Destek
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80">
                Sipariş ve ürün danışma hattımız anında mesajlaşmaya hazır.
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:underline"
            >
              <span>{whatsappDisplay}</span>
              <ArrowRightIcon width={14} height={14} />
            </a>
          </div>

          {/* 3: E-Posta */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-200/60">
                <MailIcon width={20} height={20} />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                E-Posta Adresi
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Kurumsal teklifler ve detaylı sorularınız için bize yazın.
              </p>
            </div>
            <a
              href={`mailto:${emailDisplay}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
            >
              <span className="truncate">{emailDisplay}</span>
              <ArrowRightIcon width={14} height={14} className="shrink-0" />
            </a>
          </div>

          {/* 4: Fabrika Adresi */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-200/60">
                <MapPinIcon width={20} height={20} />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Fabrika Satış Noktası
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {addressDisplay}
              </p>
            </div>
            <a
              href={storefrontContact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
            >
              <span>Haritada Göster</span>
              <ArrowRightIcon width={14} height={14} />
            </a>
          </div>
        </div>

        {/* Ana İçerik Grid: Sol Form, Sağ Bilgi & Harita */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Sol Kolon: İletişim Mesaj Formu (7 Sütun) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-10 lg:col-span-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Bize Mesaj Gönderin
              </h2>
              <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                Sorunuzu veya talebinizi aşağıdaki form ile iletin, aynı gün
                içinde size geri dönüş yapalım.
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Sağ Kolon: Mağaza Ziyaret & Toptan Bilgileri (5 Sütun) */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Ziyaret ve Çalışma Saatleri Kartı */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
                  <ClockIcon width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Çalışma & Ziyaret Saatleri
                  </h3>
                  <p className="text-xs text-slate-500">{workingHours}</p>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-3 text-xs leading-relaxed text-slate-600">
                <p>
                  Üretim tesisimiz ve perakende satış mağazamız haftanın her günü
                  açıktır. Meşe fıçılarda fermente edilen taze turşularımızı yerinde
                  tadabilir ve doğrudan üreticiden teslim alabilirsiniz.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 border border-slate-200/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Pazartesi – Pazar:</span>
                  <span className="font-bold text-slate-900">09:00 – 19:00</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Müşteri Desteği:</span>
                  <span>Kesintisiz Aktif</span>
                </div>
              </div>
            </div>

            {/* Toptan & Restoran Tedarik Kartı */}
            <div className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <TruckIcon width={20} height={20} className="text-primary" />
                <h3 className="text-sm font-bold text-primary">
                  Toptan & Restoran Siparişleri
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Restoranlar, oteller, lokantalar ve şarküteriler için 5 kg, 10 kg
                ve 18 kg bidon ambalajlarda düzenli toptan sevkiyat yapıyoruz.
                Özel toptan fiyat listesi için form üzerinden veya WhatsApp ile
                talep oluşturabilirsiniz.
              </p>
              <div className="mt-1">
                <a
                  href="/bayi-basvuru"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:underline"
                >
                  <span>Bayilik Başvurusu Yap</span>
                  <ArrowRightIcon width={12} height={12} />
                </a>
              </div>
            </div>

            {/* Google Haritalar Kartı */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <MapPinIcon width={18} height={18} className="text-rose-500" />
                  <span className="text-sm font-bold text-slate-900">
                    Konum & Yol Tarifi
                  </span>
                </div>
                <a
                  href={storefrontContact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
                >
                  <span>Haritada Aç</span>
                  <ArrowRightIcon width={12} height={12} />
                </a>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {addressDisplay}
              </p>
              <div className="mt-4 flex items-center justify-center rounded-2xl bg-slate-50 p-6 border border-slate-200/60 text-center">
                <a
                  href={storefrontContact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-dark"
                >
                  <MapPinIcon width={15} height={15} />
                  <span>Google Haritalar ile Yol Tarifi Al</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
