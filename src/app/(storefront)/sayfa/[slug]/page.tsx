import { absoluteUrl } from "@/shared/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { getContentService } from "@/modules/content/container";
import { isAppError } from "@/shared/errors";

const LEGAL_LINKS = [
  { slug: "kvkk-aydinlatma-metni", title: "KVKK Aydınlatma Metni" },
  { slug: "cerez-politikasi", title: "Gizlilik ve Çerez Politikası" },
  { slug: "mesafeli-satis-sozlesmesi", title: "Mesafeli Satış Sözleşmesi" },
  { slug: "on-bilgilendirme-formu", title: "Ön Bilgilendirme Formu" },
  { slug: "iade-ve-iptal-kosullari", title: "İptal ve İade Koşulları" },
  { slug: "teslimat-ve-kargo", title: "Teslimat ve Kargo Bilgileri" },
];

async function loadPage(slug: string) {
  try {
    return await getContentService().publishedPage(slug);
  } catch (error) {
    if (isAppError(error)) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return {};

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    alternates: { canonical: absoluteUrl(`/sayfa/${page.slug}`) },
  };
}

async function PageContent({
  params,
}: Pick<PageProps<"/sayfa/[slug]">, "params">) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Üst Breadcrumb */}
      <nav aria-label="Sayfa yolu" className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700 transition-colors">
          Ana Sayfa
        </Link>
        <span>/</span>
        <span className="text-slate-600">Yasal & Kurumsal</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{page.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
        {/* Sol Menü: Yasal Sayfalar Listesi */}
        <aside className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:sticky lg:top-28">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-3">
            Yasal Belgeler
          </span>
          <ul className="flex flex-col gap-1">
            {LEGAL_LINKS.map((item) => {
              const active = item.slug === page.slug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/sayfa/${item.slug}`}
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

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-800 mb-1">Sorularınız mı var?</p>
            <p className="leading-relaxed">
              Veri gizliliği ve haklarınız için{" "}
              <a href="mailto:info@kaplantursu.com" className="text-primary underline">
                info@kaplantursu.com
              </a>{" "}
              üzerinden bize ulaşabilirsiniz.
            </p>
          </div>
        </aside>

        {/* Sağ İçerik Kartı */}
        <article className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs">
          <header className="mb-6 border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                Resmi Yasal Bilgilendirme
              </span>
              <span className="text-xs text-slate-400">Yürürlük Tarihi: 2026</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {page.title}
            </h1>
          </header>

          <RichText source={page.content} />
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
