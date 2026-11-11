import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/cn";

/** Beyaz kart kabuğu — liste, form ve paneller için ortak çerçeve. */
export function AdminPanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Filtre / arama çubuğu. */
export function AdminToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:flex-wrap sm:items-end sm:gap-2 [&>*]:min-w-0 [&>*]:max-w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Kayıt sayısı satırı. */
export function AdminMeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[13px] font-medium text-slate-500", className)}>
      {children}
    </p>
  );
}

export function AdminTabs({
  items,
  active,
}: {
  items: { href: string; label: string; value: string }[];
  active: string;
}) {
  return (
    <nav
      aria-label="Sekmeler"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs [scrollbar-width:none]"
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:py-1.5",
              isActive
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobil pano için büyük dokunma kısayolları. */
export function AdminQuickLinks({
  items,
}: {
  items: { href: string; label: string; hint?: string }[];
}) {
  return (
    <nav
      aria-label="Hızlı erişim"
      className="grid grid-cols-2 gap-2 sm:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-h-[4.25rem] flex-col justify-center rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs active:bg-slate-50"
        >
          <span className="text-[13px] font-semibold text-slate-900">
            {item.label}
          </span>
          {item.hint ? (
            <span className="mt-0.5 text-[11px] text-slate-500">{item.hint}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function AdminPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-[13px] shadow-2xs"
      aria-label="Sayfalama"
    >
      <span className="font-medium text-slate-500 tabular-nums">
        {page} / {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 sm:h-8 sm:min-w-0"
          >
            Önceki
          </Link>
        ) : (
          <span className="inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-lg px-3 text-[13px] font-medium text-slate-300 sm:h-8 sm:min-w-0">
            Önceki
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 sm:h-8 sm:min-w-0"
          >
            Sonraki
          </Link>
        ) : (
          <span className="inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-lg px-3 text-[13px] font-medium text-slate-300 sm:h-8 sm:min-w-0">
            Sonraki
          </span>
        )}
      </div>
    </nav>
  );
}

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-12 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <p className="text-[13px] font-semibold text-slate-800">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function AdminLoading({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-[13px] font-medium text-slate-400">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
