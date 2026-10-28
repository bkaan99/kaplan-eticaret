import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { siteConfig } from "@/config/site.config";
import { getCategoryTree } from "@/modules/catalog/cached";
import { getCachedLegalLinks, getCachedMenu } from "@/modules/content/cached";
import { MailIcon, PhoneIcon } from "./icons";
import { Logo } from "./logo";

/** Yıl istek anında hesaplanır; prerender sırasında sabitlenmez. */
async function CurrentYear() {
  await connection();
  return <>{new Date().getFullYear()}</>;
}

const linkClass = "text-brand-cream/70 transition-colors hover:text-accent";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
        {title}
      </h2>
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
          Tüm ürünler
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
          Sipariş sorgula
        </Link>
      </li>
      <li>
        <Link href="/hesabim" className={linkClass}>
          Hesabım
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

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-brand-dark text-brand-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-brand-cream/70">
            {siteConfig.description}
          </p>
        </div>
        <FooterColumn title="Alışveriş">
          <Suspense fallback={null}>
            <ShopLinks />
          </Suspense>
        </FooterColumn>
        <FooterColumn title="Yardım">
          <Suspense fallback={null}>
            <FooterMenu />
          </Suspense>
        </FooterColumn>
        <FooterColumn title="İletişim">
          <li>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className={`inline-flex items-center gap-2 ${linkClass}`}
            >
              <MailIcon width={16} height={16} />
              {siteConfig.contact.email}
            </a>
          </li>
          <li>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
              className={`inline-flex items-center gap-2 ${linkClass}`}
            >
              <PhoneIcon width={16} height={16} />
              {siteConfig.contact.phone}
            </a>
          </li>
        </FooterColumn>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            ©{" "}
            <Suspense fallback={null}>
              <CurrentYear />
            </Suspense>{" "}
            {siteConfig.name}. Tüm hakları saklıdır.
          </p>
          <p>Güvenli ödeme · 256-bit SSL</p>
        </div>
      </div>
    </footer>
  );
}
