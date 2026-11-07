import { cn } from "@/shared/cn";

export interface CsvDownloadLinkProps {
  href: string;
  label?: string;
  showFormatBadge?: boolean;
  className?: string;
}

/** PageHeader ve liste başlıkları için şık, modern CSV dışa aktarma butonu. */
export function CsvDownloadLink({
  href,
  label = "CSV İndir",
  showFormatBadge,
  className,
}: CsvDownloadLinkProps) {
  // Eğer başlıkta zaten "CSV" geçmiyorsa ve showFormatBadge explicitly false yapılmadıysa .csv rozeti göster
  const shouldShowBadge =
    showFormatBadge ?? !label.toLowerCase().includes("csv");

  return (
    <a
      href={href}
      download
      title="Verileri CSV formatında indirin"
      className={cn(
        "group inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-xs",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600",
        className,
      )}
    >
      {/* Yeşil İndirme Rozeti */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 transition-colors group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600">
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </span>

      {/* Buton Başlığı */}
      <span className="whitespace-nowrap font-medium text-slate-700 group-hover:text-slate-900">
        {label}
      </span>

      {/* İsteğe bağlı .csv rozeti */}
      {shouldShowBadge ? (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-500 uppercase ring-1 ring-slate-200/80 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-200">
          .csv
        </span>
      ) : null}
    </a>
  );
}
