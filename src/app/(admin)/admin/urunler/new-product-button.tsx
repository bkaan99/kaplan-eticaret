"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FormReferences } from "@/modules/admin/catalog/product-admin.repository";
import { ProductForm } from "./product-form";

export function NewProductButton({
  references,
}: {
  references: FormReferences;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Yeni ürün
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id={titleId}
                  className="text-base font-bold text-slate-900"
                >
                  Yeni ürün
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Temel bilgiler, varyant, görsel ve SEO alanlarını doldurun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ProductForm
                mode="create"
                references={references}
                layout="modal"
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
