import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";

/** Marka logosu: Yeni minimal amblem + dengeli tipografi. `inverted` koyu zemin içindir. */
export function Logo({
  inverted = false,
  showBadge = false,
}: {
  inverted?: boolean;
  showBadge?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} ana sayfa`}
      className="group inline-flex items-center gap-3 transition-opacity hover:opacity-95"
    >
      {/* Marka Amblem İkonu */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-slate-900/10 transition-transform duration-300 group-hover:scale-105">
        <Image
          src={showBadge ? "/images/logo/kaplan-badge-logo.jpg" : "/images/logo/kaplan-minimal-logo.jpg"}
          alt="Kaplan Gurme Turşu Amblemi"
          width={44}
          height={44}
          className="h-full w-full object-cover p-0.5"
          priority
        />
      </div>

      {/* Tipografi: İçiçe girmeyi önleyen orantılı satır aralığı (leading-tight) ve net hiyerarşi */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-display text-[21px] font-bold tracking-tight leading-tight transition-colors ${
            inverted ? "text-white" : "text-slate-900 group-hover:text-primary"
          }`}
        >
          Kaplan
        </span>
        <span
          className={`text-[9px] font-bold tracking-[0.28em] uppercase leading-none transition-colors ${
            inverted ? "text-amber-400" : "text-emerald-700"
          }`}
        >
          Gurme Turşu
        </span>
      </div>
    </Link>
  );
}

