import Link from "next/link";
import { formatMoney } from "@/shared/money";
import {
  ArrowRightIcon,
  HeartIcon,
  LeafIcon,
  TruckIcon,
} from "@/components/storefront/icons";

/**
 * Tek renk (monochrome) boş sepet simgesi.
 * Şık, sade ve tek ton çizgi stiliyle sepetin boş olduğunu simgeler.
 */
function EmptyCartMonoIcon({ className = "" }: { className?: string }) {
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
      {/* Arka plan hafif kesikli rehber dairesi */}
      <circle
        cx="32"
        cy="32"
        r="28"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="opacity-25"
      />

      {/* Ana tek renk alışveriş çantası */}
      <path
        d="M19 22h26l-2.2 24.2a2 2 0 0 1-2 1.8H23.2a2 2 0 0 1-2-1.8z"
        className="opacity-90"
      />
      {/* Kulplar */}
      <path
        d="M25 22v-4a7 7 0 0 1 14 0v4"
        strokeWidth="2"
        className="opacity-90"
      />

      {/* Çanta üzeri zarif kesikli hat */}
      <path
        d="M26 31h12"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        className="opacity-35"
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

export function EmptyCart({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number;
}) {
  return (
    <div className="mx-auto my-4 flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center sm:px-10 sm:py-16">
      {/* Tek Renk Logo / Rozet */}
      <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm shadow-slate-200/50 ring-8 ring-slate-100/80">
        <EmptyCartMonoIcon />
      </div>

      {/* Başlık ve Açıklama */}
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Sepetiniz henüz boş.
      </h2>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base sm:leading-relaxed">
        Geleneksel ev yapımı turşularımız, katkısız şalgam sularımız veya kendi damak
        tadınıza özel hazırlayabileceğiniz turşu bidonları arasından seçim yaparak
        sepetinizi doldurabilirsiniz.
      </p>

      {/* Ücretsiz Kargo ve Katkısız Güvencesi Rozeti */}
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50/80 border border-emerald-200/60 px-4 py-1.5 text-xs font-semibold text-emerald-800">
        <TruckIcon width={15} height={15} className="text-emerald-700" />
        <span>
          {formatMoney(freeShippingThreshold)} ve üzeri siparişlerde kargo{" "}
          <strong>ücretsiz</strong>
        </span>
      </div>

      {/* Aksiyon Butonları */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/ara"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
        >
          <span>Alışverişe Başla</span>
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
        <Link
          href="/favoriler"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
        >
          <HeartIcon width={15} height={15} className="text-rose-500" />
          <span>Favorilerim</span>
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
