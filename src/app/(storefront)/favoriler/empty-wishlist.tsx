import Link from "next/link";
import { ArrowRightIcon } from "@/components/storefront/icons";

/**
 * Tek renk (monochrome) favori bulunamadı simgesi.
 * Şık, sade ve tek ton çizgi stiliyle favori listesinin boş olduğunu simgeler.
 */
function EmptyWishlistMonoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="56"
      height="56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Arka plan hafif daire rehberi */}
      <circle
        cx="32"
        cy="32"
        r="28"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="opacity-25"
      />

      {/* Ana tek renk kalp simgesi */}
      <path
        d="M45.5 18.5a7.8 7.8 0 0 0-11 0L32 21l-2.5-2.5a7.8 7.8 0 0 0-11 11L32 43l13.5-13.5a7.8 7.8 0 0 0 0-11z"
        className="opacity-90"
      />

      {/* Kalp içi hafif boşluk kırık çizgisi */}
      <path
        d="M26 27c-1 1-1.5 2.5-1 4"
        strokeWidth="1.8"
        className="opacity-40"
      />

      {/* Köşedeki mini 0 boşluk rozeti */}
      <circle cx="46" cy="44" r="8" fill="white" strokeWidth="2" />
      <text
        x="46"
        y="47.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
      >
        0
      </text>

      {/* Minik dekoratif ışıltı artıları */}
      <path d="M14 18v3M12.5 19.5h3" strokeWidth="1.5" className="opacity-40" />
      <path d="M49 14v2.5M47.8 15.2h2.4" strokeWidth="1.5" className="opacity-40" />
    </svg>
  );
}

const quickCategories = [
  { label: "Çıtır Kornişon", href: "/ara?q=salatalık" },
  { label: "Çubuk Lahana", href: "/ara?q=lahana" },
  { label: "Doğal Şalgam Suyu", href: "/ara?q=şalgam" },
  { label: "Karışık Ev Turşusu", href: "/ara?q=karışık" },
];

export function EmptyWishlist() {
  return (
    <div className="mx-auto my-4 flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center sm:px-10 sm:py-16">
      {/* Tek Renk Logo / Rozet */}
      <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm shadow-slate-200/50 ring-8 ring-slate-100/80">
        <EmptyWishlistMonoIcon />
      </div>

      {/* Başlık ve Açıklama */}
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Henüz favori ürününüz yok.
      </h2>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base sm:leading-relaxed">
        Beğendiğiniz el yapımı turşuları ve geleneksel lezzetleri ürün kartlarındaki
        kalp simgesine tıklayarak favorilerinize ekleyebilir, dilediğiniz zaman buradan
        kolayca inceleyip sipariş verebilirsiniz.
      </p>

      {/* Aksiyon Butonları */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/ara"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
        >
          <span>Tüm Ürünleri Keşfet</span>
          <ArrowRightIcon width={16} height={16} />
        </Link>
        <Link
          href="/kendi-tursunu-yap"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="text-amber-500 font-bold" aria-hidden="true">
            ✦
          </span>
          <span>Kendi Turşunu Yap</span>
        </Link>
      </div>

      {/* Popüler Kategorilere Hızlı Geçiş */}
      <div className="mt-8 w-full border-t border-slate-200/70 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Popüler Lezzetler
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {quickCategories.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary hover:shadow-2xs"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
