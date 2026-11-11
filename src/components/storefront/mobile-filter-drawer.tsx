"use client";

import { useEffect, useId, useState } from "react";
import { XIcon } from "@/components/storefront/icons";

/** Mobilde Filtrele butonu + sheet; lg+ görünmez (sidebar kullanılır). */
export function MobileFilterDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-filter-drawer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-theme border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
      >
        Filtrele
      </button>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 animate-[fade-in_200ms_ease-out] bg-black/50 backdrop-blur-xs"
            aria-hidden="true"
          />
          <aside
            id="mobile-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] animate-[drawer-in-up_280ms_ease-out] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-base font-semibold">
                Filtrele
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Filtreleri kapat"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <XIcon width={18} height={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
