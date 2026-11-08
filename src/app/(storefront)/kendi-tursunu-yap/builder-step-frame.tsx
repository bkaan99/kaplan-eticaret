"use client";

import { type ReactNode } from "react";

export function Step({
  id,
  index,
  title,
  hint,
  children,
}: {
  id?: string;
  index: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex scroll-mt-44 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-xl font-bold text-primary sm:text-2xl">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-storefront text-sm font-bold text-white">
            {index}
          </span>
          {title}
        </h2>
        {hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
