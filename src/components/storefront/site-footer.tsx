import Link from "next/link";
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
  WhatsAppIcon,
} from "./icons";
import { Logo } from "./logo";

function CurrentYear() {
  return <>{new Date().getFullYear()}</>;
}

const linkClass = "text-slate-600 transition-colors hover:text-primary";

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
  const [menuItems, legal] = await Promise.all([
    getCachedMenu("footer"),
    getCachedLegalLinks(),
  ]);
  const known = new Set([
    "/sayfa/hakkimizda",
    "/sayfa/sikca-sorulan-sorular",
    "/siparis-sorgula",
    "/sayfa/teslimat-ve-kargo",
    "/iletisim",
    ...menuItems.map((item) => item.url),
  ]);
  const extraLegal = legal.filter((page) => !known.has(page.href));

  return (
    <>
      <li>
        <Link href="/sayfa/hakkimizda" className={linkClass}>
          Hakkımızda
        </Link>
      </li>
      <li>
        <Link href="/sayfa/sikca-sorulan-sorular" className={linkClass}>
          Sıkça Sorulan Sorular
        </Link>
      </li>
      <li>
        <Link href="/siparis-sorgula" className={linkClass}>
          Sipariş Sorgulama
        </Link>
      </li>
      <li>
        <Link href="/sayfa/teslimat-ve-kargo" className={linkClass}>
          Teslimat ve Kargo
        </Link>
      </li>
      <li>
        <Link href="/iletisim" className={linkClass}>
          İletişim & Mağazamız
        </Link>
      </li>
      {menuItems.map((item) => (
        <li key={`${item.label}-${item.url}`}>
          <Link href={item.url} className={linkClass}>
            {item.label}
          </Link>
        </li>
      ))}
      {extraLegal.map((page) => (
        <li key={page.href}>
          <Link href={page.href} className={linkClass}>
            {page.title}
          </Link>
        </li>
      ))}
    </>
  );
}

async function FooterContact() {
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
            <MailIcon width={20} height={20} className={contactIconClass} />
            <span>{contact.email}</span>
          </a>
        </li>
      ) : null}
      <li>
        <a
          href={`tel:${storefrontContact.phoneTel}`}
          className={contactRowClass}
        >
          <PhoneIcon width={20} height={20} className={contactIconClass} />
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
            <WhatsAppIcon
              width={20}
              height={20}
              className="mt-0.5 size-5 shrink-0 text-[#25d366]"
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
          <MapPinIcon width={20} height={20} className={contactIconClass} />
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
          <InstagramIcon width={20} height={20} className={contactIconClass} />
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
          <BagIcon width={20} height={20} className={contactIconClass} />
          <span>Trendyol Mağazası</span>
        </a>
      </li>
      <li>
        <span className={`${contactRowClass} hover:text-slate-600`}>
          <ClockIcon width={20} height={20} className={contactIconClass} />
          <span>{storefrontContact.workingHours}</span>
        </span>
      </li>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="iletisim"
      className="mt-20 scroll-mt-32 bg-slate-50 text-slate-700"
    >
      {/* Üst Güvence Rozetleri */}
      <div className="bg-primary">
        <div className="mx-auto grid max-w-[1600px] px-4 lg:px-8 2xl:px-12 grid-cols-2 gap-5 py-7 sm:grid-cols-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
              <LeafIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white sm:text-sm">
                %100 Katkısız
              </span>
              <span className="text-[11px] text-white/70 sm:text-xs">
                Doğal fermantasyon
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
              <JarIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white sm:text-sm">
                Kırılmaz Ambalaj
              </span>
              <span className="text-[11px] text-white/70 sm:text-xs">
                Özel hava yastıklı koli
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
              <TruckIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white sm:text-sm">
                Hızlı Kargo
              </span>
              <span className="text-[11px] text-white/70 sm:text-xs">
                48 saatte kapınızda
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
              <PhoneIcon width={18} height={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white sm:text-sm">
                Müşteri Desteği
              </span>
              <span className="text-[11px] text-white/70 sm:text-xs">
                {storefrontContact.workingHours}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Sütunlar */}
      <div className="mx-auto grid max-w-[1600px] px-4 lg:px-8 2xl:px-12 gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-12 lg:gap-10">
        {/* Marka Tanıtımı */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Logo showBadge />
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
        <div className="mx-auto flex max-w-[1600px] px-4 lg:px-8 2xl:px-12 flex-col gap-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p>
              ©{" "}
              <Suspense fallback={null}>
                <CurrentYear />
              </Suspense>{" "}
              {siteConfig.name}. Tüm hakları saklıdır.
            </p>
            <p className="text-[11px] text-slate-400">
              Bu site{" "}
              <a
                href="https://bilgekaangurgen.com.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 transition-colors hover:text-primary hover:underline"
              >
                bilgekaangurgen.com.tr
              </a>{" "}
              tarafından tasarlanmıştır.
            </p>
          </div>

          {/* Yasal Sözleşme Linkleri */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <Link
              href="/sayfa/mesafeli-satis-sozlesmesi"
              className="transition-colors hover:text-primary hover:underline"
            >
              Mesafeli Satış
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href="/sayfa/kvkk-aydinlatma-metni"
              className="transition-colors hover:text-primary hover:underline"
            >
              KVKK
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href="/sayfa/cerez-politikasi"
              className="transition-colors hover:text-primary hover:underline"
            >
              Gizlilik ve Çerez
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href="/sayfa/iade-ve-iptal-kosullari"
              className="transition-colors hover:text-primary hover:underline"
            >
              İade Koşulları
            </Link>
          </div>

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
