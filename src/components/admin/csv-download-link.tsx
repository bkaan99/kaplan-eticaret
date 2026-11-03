import { cn } from "@/shared/cn";

/** PageHeader aksiyonları için CSV dışa aktarma bağlantısı. */
export function CsvDownloadLink({
  href,
  label = "CSV indir",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      download
      className={cn(
        "group inline-flex h-10 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white pr-3.5 pl-2.5 text-sm font-semibold text-slate-700 shadow-xs transition",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        "focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:outline-none",
        className,
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100/80 group-hover:ring-emerald-200">
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </span>
      <span className="flex flex-col items-start leading-none">
        <span>{label}</span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase group-hover:text-slate-500">
          Dışa aktar
        </span>
      </span>
      <span className="ml-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase ring-1 ring-slate-200/80 group-hover:bg-white group-hover:text-slate-600">
        CSV
      </span>
    </a>
  );
}
