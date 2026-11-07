import { absoluteUrl } from "@/shared/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/storefront/json-ld";
import { getContentService } from "@/modules/content/container";
import {
  LEGAL_PAGE_TEMPLATES,
  type LegalPageTemplate,
} from "@/modules/content/legal-templates";
import { storefrontContact } from "@/config/storefront-contact";
import { isAppError } from "@/shared/errors";

const CORPORATE_LINKS = [
  { slug: "hakkimizda", title: "Hakkımızda", href: "/sayfa/hakkimizda" },
  {
    slug: "sikca-sorulan-sorular",
    title: "Sıkça Sorulan Sorular",
    href: "/sayfa/sikca-sorulan-sorular",
  },
  { slug: "iletisim", title: "İletişim & Mağazamız", href: "/iletisim" },
];

const LEGAL_LINKS = [
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    href: "/sayfa/mesafeli-satis-sozlesmesi",
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    href: "/sayfa/on-bilgilendirme-formu",
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    href: "/sayfa/kvkk-aydinlatma-metni",
  },
  {
    slug: "cerez-politikasi",
    title: "Gizlilik ve Çerez Politikası",
    href: "/sayfa/cerez-politikasi",
  },
  {
    slug: "iade-ve-iptal-kosullari",
    title: "İptal ve İade Koşulları",
    href: "/sayfa/iade-ve-iptal-kosullari",
  },
  {
    slug: "teslimat-ve-kargo",
    title: "Teslimat ve Kargo Bilgileri",
    href: "/sayfa/teslimat-ve-kargo",
  },
];

export function generateStaticParams() {
  return LEGAL_PAGE_TEMPLATES.map((t) => ({ slug: t.slug }));
}

async function loadPage(slug: string) {
  try {
    const dbPage = await getContentService().publishedPage(slug);
    if (dbPage) return dbPage;
  } catch (error) {
    if (!isAppError(error)) throw error;
  }

  // Veritabanında henüz yayınlanmadıysa veya taslaksa dahili resmi şablonu kullan
  const template = LEGAL_PAGE_TEMPLATES.find((t) => t.slug === slug);
  if (template) {
    return {
      id: `builtin-${template.slug}`,
      title: template.title,
      slug: template.slug,
      content: template.content,
      isPublished: true,
      seoTitle: template.title,
      seoDescription: `${template.title} hakkında resmi ve güncel bilgilendirme metni.`,
      updatedAt: new Date(),
    };
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return {};

  const title = page.seoTitle ?? page.title;
  const description =
    page.seoDescription ??
    `${page.title} hakkında detaylı bilgilendirme ve kurumsal koşullar.`;
  const url = absoluteUrl(`/sayfa/${page.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function PageContent({
  params,
}: Pick<PageProps<"/sayfa/[slug]">, "params">) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  const isLegal = LEGAL_LINKS.some((l) => l.slug === page.slug);
  const badgeText = isLegal ? "Resmi Yasal Belge" : "Kurumsal Bilgilendirme";

  return (
    <div className="flex flex-col gap-6 py-4">
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
              name: isLegal ? "Yasal Belgeler" : "Kurumsal",
              item: absoluteUrl(
                isLegal
                  ? "/sayfa/mesafeli-satis-sozlesmesi"
                  : "/sayfa/hakkimizda",
              ),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: page.title,
              item: absoluteUrl(`/sayfa/${page.slug}`),
            },
          ],
        }}
      />
      {/* Üst Breadcrumb */}
      <nav
        aria-label="Sayfa yolu"
        className="flex items-center gap-2 text-xs text-slate-400"
      >
        <Link href="/" className="transition-colors hover:text-slate-700">
          Ana Sayfa
        </Link>
        <span>/</span>
        <span className="text-slate-600">
          {isLegal ? "Yasal Belgeler" : "Kurumsal"}
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">{page.title}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Sol Menü: Kurumsal & Yasal Sayfalar Listesi */}
        <aside className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:sticky lg:top-28 lg:col-span-4">
          {/* Kurumsal Bağlantılar */}
          <div>
            <span className="mb-2.5 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Kurumsal
            </span>
            <ul className="flex flex-col gap-1">
              {CORPORATE_LINKS.map((item) => {
                const active = item.slug === page.slug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span>{item.title}</span>
                      {active ? <span>→</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Yasal Bağlantılar */}
          <div className="border-t border-slate-100 pt-5">
            <span className="mb-2.5 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Yasal Belgeler
            </span>
            <ul className="flex flex-col gap-1">
              {LEGAL_LINKS.map((item) => {
                const active = item.slug === page.slug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span>{item.title}</span>
                      {active ? <span>→</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* İletişim & Yardım Kutusu */}
          <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/60 p-4 text-xs text-slate-600">
            <p className="mb-1.5 font-bold text-slate-900">Müşteri Desteği</p>
            <p className="mb-3 leading-relaxed text-slate-600">
              Siparişiniz, yasal haklarınız veya ürünlerimizle ilgili sorularınız
              için bize ulaşabilirsiniz.
            </p>
            <div className="flex flex-col gap-1.5 font-semibold text-slate-800">
              <a
                href={`tel:${storefrontContact.phoneTel}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <span>📞</span>
                <span>{storefrontContact.phone}</span>
              </a>
              <a
                href="mailto:info@kaplantursu.com"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <span>✉️</span>
                <span>info@kaplantursu.com</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Sağ İçerik Kartı */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-10 lg:col-span-8">
          <header className="mb-6 border-b border-slate-100 pb-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                {badgeText}
              </span>
              <span className="text-xs text-slate-400">
                Güncellenme: 2026
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {page.title}
            </h1>
          </header>

          <RichText source={page.content} />

          {/* Alt Bilgi Kutusu */}
          <div className="mt-10 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-700">
              Kaplan Gıda ve Turşuculuk Tic. Ltd. Şti.
            </p>
            <p>
              Adres: {storefrontContact.address} · Tel: {storefrontContact.phone}{" "}
              · E-posta: info@kaplantursu.com
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function StaticPage({ params }: PageProps<"/sayfa/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-400">
          Belge yükleniyor...
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
