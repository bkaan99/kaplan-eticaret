"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBrandAction } from "./actions";
import { type BrandView } from "./attribute-types";

export interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBrand: BrandView | null;
  onSuccess?: () => void;
}

export function BrandModal({
  isOpen,
  onClose,
  editingBrand,
  onSuccess,
}: BrandModalProps) {
  const { pending, error, run, setError } = useActionRunner();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setName(editingBrand?.name ?? "");

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, setError, editingBrand]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    run(
      () => saveBrandAction(editingBrand?.id ?? null, name.trim()),
      () => {
        onSuccess?.();
        onClose();
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="brand-modal-title"
              className="text-[15px] font-semibold text-slate-900"
            >
              {editingBrand ? "Markayı düzenle" : "Yeni marka"}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Katalog ürünlerinde görünecek üretici / marka adı.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4 px-5 py-5">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800"
              >
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">
                Marka adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn. Kaplan Turşu"
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending
                ? "Kaydediliyor…"
                : editingBrand
                  ? "Güncelle"
                  : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
