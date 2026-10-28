import Link from "next/link";
import { siteConfig } from "@/config/site.config";

/** Marka logosu: kavanoz amblemi + yazı. `inverted` koyu zemin içindir. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} ana sayfa`}
      className="inline-flex items-center gap-2.5"
    >
      <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
        <rect x="11" y="4" width="18" height="7" rx="2" fill="#d4a017" />
        <path
          d="M9 11h22a3 3 0 0 1 3 3v19a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V14a3 3 0 0 1 3-3z"
          fill={inverted ? "#fffdf8" : "#2f5233"}
        />
        <ellipse
          cx="16"
          cy="25"
          rx="3.2"
          ry="7.5"
          fill={inverted ? "#4f7a3a" : "#8fb35a"}
        />
        <ellipse
          cx="24"
          cy="24"
          rx="3.2"
          ry="7.5"
          fill={inverted ? "#2f5233" : "#c8d47a"}
          transform="rotate(10 24 24)"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-2xl font-semibold tracking-tight ${inverted ? "text-brand-cream" : "text-primary"}`}
        >
          Kaplan
        </span>
        <span
          className={`mt-0.5 text-[10px] font-semibold tracking-[0.35em] ${inverted ? "text-accent" : "text-brand-leaf"}`}
        >
          TURŞU
        </span>
      </span>
    </Link>
  );
}
