import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedLegalLinks, getCachedMenu } from "@/modules/content/cached";
import { getCachedContactSettings } from "@/modules/settings/cached";
import {
  BagIcon,
  ClockIcon,
  InstagramIcon,
  JarIcon,
  LeafIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
} from "./icons";
import { Logo } from "./logo";

/** Yıl istek anında hesaplanır; prerender sırasında sabitlenmez. */
async function CurrentYear() {
  await connection();
  return <>{new Date().getFullYear()}</>;
}

const linkClass =
  "text-slate-600 transition-colors hover:text-primary";

const contactRowClass =
  "inline-flex w-full items-start gap-2.5 text-sm leading-snug text-slate-600 transition-colors hover:text-primary";

const contactIconClass = "mt-0.5 size-5 shrink-0 text-slate-400";

const paymentBadges = [
  { src: "/images/payment/troy.svg", alt: "Troy", width: 52, height: 24 },
  { src: "/images/payment/visa.svg", alt: "Visa", width: 48, height: 24 },
  {
    src: "/images/payment/mastercard.svg",
    alt: "Mastercard",
    width: 40,
    height: 24,
  },
  {
    src: "/images/payment/ssl.svg",
    alt: "256-Bit SSL",
    width: 92,
    height: 24,
  },
  {
    src: "/images/payment/paytr.svg",
    alt: "PayTR",
    width: 80,
    height: 24,
  },
] as const;

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold tracking-[0.18em] text-slate-900 uppercase">
        {title}
      </h3>
      <ul className="flex flex-col gap-3 text-sm">{children}</ul>
    </div>
  );
}

async function ShopLinks() {
  await connection();
  const tree = await getCategoryTree();

  return (
    <>
      {tree.map((category) => (
        <li key={category.id}>
          <Link href={`/kategori/${category.slug}`} className={linkClass}>
            {category.name}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/ara" className={linkClass}>
          Tüm Ürünler
        </Link>
      </li>
    </>
  );
}

async function FooterMenu() {
  await connection();
  const [menuItems, legal] = await Promise.all([
    getCachedMenu("footer"),
    getCachedLegalLinks(),
  ]);
  const known = new Set(menuItems.map((item) => item.url));
  const items = [
    ...menuItems.map((item) => ({ label: item.label, url: item.url })),
    ...legal
      .filter((page) => !known.has(page.href))
      .map((page) => ({ label: page.title, url: page.href })),
  ];

  return (
    <>
      <li>
        <Link href="/siparis-sorgula" className={linkClass}>
          Sipariş Sorgulama
        </Link>
      </li>
      <li>
        <Link href="/hesabim" className={linkClass}>
          Hesabım & Siparişlerim
        </Link>
      </li>
      {items.map((item) => (
        <li key={`${item.label}-${item.url}`}>
          <Link href={item.url} className={linkClass}>
            {item.label}
          </Link>
        </li>
      ))}
    </>
  );
}

async function FooterContact() {
  await connection();
  const contact = await getCachedContactSettings();
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`
    : null;
  const address = storefrontContact.address;
  const instagramUrl =
    contact.instagramUrl?.trim() || storefrontContact.instagramUrl;

  return (
    <>
      {contact.email ? (
        <li>
          <a href={`mailto:${contact.email}`} className={contactRowClass}>
            <MailIcon
              width={20}
              height={20}
              className={contactIconClass}
            />
            <span>{contact.email}</span>
          </a>
        </li>
      ) : null}
      <li>
        <a
          href={`tel:${storefrontContact.phoneTel}`}
          className={contactRowClass}
        >
          <PhoneIcon
            width={20}
            height={20}
            className={contactIconClass}
          />
          <span>{storefrontContact.phone}</span>
        </a>
      </li>
      {contact.whatsapp ? (
        <li>
          <a
            href={whatsappHref ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={contactRowClass}
          >
            <PhoneIcon
              width={20}
              height={20}
              className={contactIconClass}
            />
            <span>WhatsApp Destek</span>
          </a>
        </li>
      ) : null}
      <li>
        <a
          href={storefrontContact.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={contactRowClass}
        >
          <MapPinIcon
            width={20}
            height={20}
            className={contactIconClass}
          />
          <span>{address}</span>
        </a>
      </li>
      <li>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={contactRowClass}
        >
          <InstagramIcon
            width={20}
            height={20}
            className={contactIconClass}
          />
          <span>Instagram</span>
        </a>
      </li>
      <li>
        <a
          href={storefrontContact.trendyolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={contactRowClass}
        >
          <BagIcon
            width={20}
            height={20}
            className={contactIconClass}
          />
          <span>Trendyol Mağazası</span>
        </a>
      </li>
      <li>
        <span className={`${contactRowClass} hover:text-slate-600`}>
          <ClockIcon
            width={20}
            height={20}
            className={contactIconClass}
          />
          <span>{storefrontContact.workingHours}</span>
        </span>
      </li>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 text-slate-700">
      {/* Üst Güvence Rozetleri */}
      <div className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-4 py-8 sm:grid-cols-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-primary shadow-2xs">
              <LeafIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-900">
                %100 Katkısız
              </span>
              <span className="text-[11px] text-slate-500">
                Doğal fermantasyon
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-primary shadow-2xs">
              <JarIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-900">
                Kırılmaz Ambalaj
              </span>
              <span className="text-[11px] text-slate-500">
                Özel hava yastıklı koli
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-primary shadow-2xs">
              <TruckIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-900">
                Hızlı Kargo
              </span>
              <span className="text-[11px] text-slate-500">
                48 saatte kapınızda
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-primary shadow-2xs">
              <PhoneIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-900">
                Müşteri Desteği
              </span>
              <span className="text-[11px] text-slate-500">
                {storefrontContact.workingHours}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Sütunlar */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-12 lg:gap-10">
        {/* Marka Tanıtımı */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            {siteConfig.description} Meşe fıçılarda, Çankırı kaya tuzu ve
            sarımsakla sabırla fermente edilen katkısız lezzetler.
          </p>
          <div className="mt-1 flex flex-col gap-1.5 text-xs text-slate-500">
            <span>🌿 Geleneksel Ev Yapımı Tarifler</span>
            <span>📍 Türkiye Geneli Korumalı Gönderim</span>
          </div>
        </div>

        {/* Alışveriş */}
        <div className="lg:col-span-2">
          <FooterColumn title="Alışveriş">
            <Suspense fallback={null}>
              <ShopLinks />
            </Suspense>
          </FooterColumn>
        </div>

        {/* Kurumsal / Yardım */}
        <div className="lg:col-span-2">
          <FooterColumn title="Yardım">
            <Suspense fallback={null}>
              <FooterMenu />
            </Suspense>
          </FooterColumn>
        </div>

        {/* İletişim */}
        <div className="lg:col-span-3">
          <FooterColumn title="İletişim">
            <Suspense fallback={null}>
              <FooterContact />
            </Suspense>
          </FooterColumn>
        </div>
      </div>

      {/* Alt Telif & Ödeme Yöntemleri Barı */}
      <div className="border-t border-slate-200/80 bg-slate-100/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            ©{" "}
            <Suspense fallback={null}>
              <CurrentYear />
            </Suspense>{" "}
            {siteConfig.name}. Tüm hakları saklıdır.
          </p>

          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Ödeme ve güvenlik rozetleri"
          >
            {paymentBadges.map((badge) => (
              <span
                key={badge.alt}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- küçük statik SVG rozetler; Latin-1 bozulması ve Image SVG sorunlarından kaçınmak için */}
                <img
                  src={badge.src}
                  alt={badge.alt}
                  width={badge.width}
                  height={badge.height}
                  className="h-5 w-auto"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
