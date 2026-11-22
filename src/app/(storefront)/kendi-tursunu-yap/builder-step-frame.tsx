"use client";

import { type ReactNode } from "react";

/** Tüm adımlarda ortak kart yüzeyi: gölge ve kenarlık tek yerde. */
export const CARD_SURFACE =
  "rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(11,35,24,0.04),0_12px_28px_-16px_rgba(11,35,24,0.16)]";

export function Step({
  id,
  index,
  title,
  hint,
  done = false,
  children,
}: {
  id?: string;
  index: number;
  title: string;
  hint?: ReactNode;
  /** Adım tamamlandıysa numara yerine onay işareti gösterilir. */
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`flex scroll-mt-44 flex-col gap-4 p-4 sm:p-6 ${CARD_SURFACE}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-xl font-bold text-primary sm:text-2xl">
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-storefront text-sm font-bold text-white transition-colors duration-300 ${
              done ? "bg-brand-leaf" : "bg-primary"
            }`}
          >
            {done ? (
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Tamamlandı"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
            ) : (
              index
            )}
          </span>
          {title}
        </h2>
        {hint ? (
          <span className="rounded-full bg-[#f4f5f0] px-3 py-1 text-xs font-semibold text-slate-600">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
