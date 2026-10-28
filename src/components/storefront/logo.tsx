import Link from "next/link";
import { siteConfig } from "@/config/site.config";

/** Marka logosu: Modern minimalist amblem + tipografi. `inverted` koyu zemin içindir. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} ana sayfa`}
      className="group inline-flex items-center gap-3 transition-opacity hover:opacity-90"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {/* Minimalist Kavanoz İkonu */}
          <path d="M8 3h8" />
          <path d="M9 3v2h6V3" />
          <rect x="5" y="7" width="14" height="14" rx="4" />
          <path d="M10 11c0 2 2 3 2 5" stroke="#f59e0b" />
          <circle cx="12" cy="14" r="1" fill="#f59e0b" stroke="none" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display text-2xl font-bold tracking-tight ${inverted ? "text-white" : "text-slate-900"}`}
        >
          Kaplan
        </span>
        <span
          className={`mt-0.5 text-[9px] font-bold tracking-[0.3em] uppercase ${inverted ? "text-amber-400" : "text-primary"}`}
        >
          Gurme Turşu
        </span>
      </div>
    </Link>
  );
}
