import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { siteConfig } from "@/config/site.config";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedLegalLinks, getCachedMenu } from "@/modules/content/cached";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { JarIcon, LeafIcon, MailIcon, PhoneIcon, TruckIcon } from "./icons";
import { Logo } from "./logo";

/** Yıl istek anında hesaplanır; prerender sırasında sabitlenmez. */
async function CurrentYear() {
  await connection();
  return <>{new Date().getFullYear()}</>;
}

const linkClass = "text-slate-600 transition-colors hover:text-primary";

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
      <ul className="flex flex-col gap-2.5 text-sm">{children}</ul>
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
  const phoneHref = contact.phone
    ? `tel:${contact.phone.replace(/\s/g, "")}`
    : null;
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <>
      {contact.email ? (
        <li>
          <a
            href={`mailto:${contact.email}`}
            className={`inline-flex items-center gap-2 ${linkClass}`}
          >
            <MailIcon width={16} height={16} className="text-slate-400" />
            <span>{contact.email}</span>
          </a>
        </li>
      ) : null}
      {contact.phone ? (
        <li>
          <a
            href={phoneHref ?? "#"}
            className={`inline-flex items-center gap-2 ${linkClass}`}
          >
            <PhoneIcon width={16} height={16} className="text-slate-400" />
            <span>{contact.phone}</span>
          </a>
        </li>
      ) : null}
      {contact.whatsapp ? (
        <li>
          <a
            href={whatsappHref ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 ${linkClass}`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              W
            </span>
            <span>WhatsApp Destek</span>
          </a>
        </li>
      ) : null}
      {contact.address ? (
        <li className="mt-1 text-xs leading-relaxed text-slate-500">
          📍 {contact.address}
        </li>
      ) : null}
      <li className="mt-2 text-xs text-slate-500">
        {contact.workingHours ||
          "Sipariş sorularınız için bize her zaman e-posta veya telefon ile ulaşabilirsiniz."}
      </li>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 text-slate-700">
      {/* Üst Güvence Rozetleri */}
      <div className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <LeafIcon width={18} height={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">%100 Katkısız</span>
              <span className="text-[11px] text-slate-500">Doğal fermantasyon</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <JarIcon width={18} height={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Kırılmaz Ambalaj</span>
              <span className="text-[11px] text-slate-500">Özel hava yastıklı koli</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <TruckIcon width={18} height={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Hızlı Kargo</span>
              <span className="text-[11px] text-slate-500">48 saatte kapınızda</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <PhoneIcon width={18} height={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Müşteri Desteği</span>
              <span className="text-[11px] text-slate-500">Hafta içi 09:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Sütunlar */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
        {/* Marka Tanıtımı */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            {siteConfig.description} Meşe fıçılarda, Çankırı kaya tuzu ve sarımsakla sabırla fermente edilen katkısız lezzetler.
          </p>
          <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-500">
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

          {/* Ödeme Rozetleri */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">Troy</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">Visa</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">Mastercard</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-primary">256-Bit SSL</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">PayTR Güvencesi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
