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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-amber-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-lg shadow-2xs">
              🏢
            </span>
            <div>
              <h2
                id="brand-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingBrand ? "Markayı Düzenle" : "Yeni Marka / Üretici Ekle"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingBrand
                  ? `"${editingBrand.name}" marka kaydını güncelliyorsunuz`
                  : "Katalog ürünleri için marka kaydı açın"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Marka / Üretici Adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Kaplan Gurme, Çubuk Lezzetleri..."
                className="h-9 text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-9 px-3.5 text-[13px] font-medium text-slate-600 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              className="h-9 bg-slate-900 px-4 text-[13px] font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Ekleniyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>{editingBrand ? "Güncelle" : "Markayı Kaydet"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
