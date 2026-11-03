import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";

/** Marka logosu: Yeni minimal amblem + dengeli tipografi. `inverted` koyu zemin içindir. */
export function Logo({
  inverted = false,
  showBadge = false,
  href = "/",
  compact = false,
}: {
  inverted?: boolean;
  showBadge?: boolean;
  href?: string;
  /** Admin kenar çubuğu gibi dar alanlar için daha küçük boyut. */
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={`group inline-flex items-center transition-opacity hover:opacity-95 ${
        compact ? "gap-2" : "gap-2 md:gap-3"
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 ${
          showBadge
            ? compact
              ? "h-10 w-10 rounded-full"
              : "h-12 w-12 rounded-full md:h-[72px] md:w-[72px]"
            : compact
              ? "h-9 w-9 rounded-xl bg-white shadow-xs ring-1 ring-slate-900/10"
              : "h-11 w-11 rounded-xl bg-white shadow-xs ring-1 ring-slate-900/10"
        }`}
      >
        <Image
          src={
            showBadge
              ? "/images/logo/kaplan-badge-logo.jpg"
              : "/images/logo/kaplan-minimal-logo.jpg"
          }
          alt="Kaplan Gurme Turşu Amblemi"
          width={144}
          height={144}
          className={`h-full w-full object-cover ${showBadge ? "scale-[1.34]" : "p-0.5"}`}
          priority
        />
      </div>

      <div className="flex flex-col justify-center whitespace-nowrap">
        <span
          className={`font-display font-bold tracking-tight leading-tight transition-colors ${
            compact ? "text-lg" : "text-[21px]"
          } ${
            inverted ? "text-white" : "text-slate-900 group-hover:text-primary"
          }`}
        >
          Kaplan
        </span>
        <span
          className={`font-bold tracking-[0.28em] uppercase leading-none transition-colors ${
            compact ? "text-[8px]" : "text-[9px]"
          } ${inverted ? "text-amber-400" : "text-emerald-700"}`}
        >
          Gurme Turşu
        </span>
      </div>
    </Link>
  );
}
