"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAttributeAction } from "./actions";

export interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAttribute: {
    id: string | null;
    name: string;
    isFilterable: boolean;
  } | null;
  onSuccess?: () => void;
}

export function AttributeModal({
  isOpen,
  onClose,
  editingAttribute,
  onSuccess,
}: AttributeModalProps) {
  const { pending, error, run, setError } = useActionRunner();
  const [name, setName] = useState("");
  const [isFilterable, setIsFilterable] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingAttribute) {
      setName(editingAttribute.name);
      setIsFilterable(editingAttribute.isFilterable);
    } else {
      setName("");
      setIsFilterable(true);
    }

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
  }, [isOpen, editingAttribute, onClose, setError]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    run(
      () =>
        saveAttributeAction(editingAttribute?.id ?? null, {
          name: name.trim(),
          isFilterable,
        }),
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
      aria-labelledby="attribute-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🏷️
            </span>
            <div>
              <h2
                id="attribute-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingAttribute?.id
                  ? "Niteliği Düzenle"
                  : "Yeni Nitelik Tanımla"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ürünlerin filtrelenebilmesi için özellik başlığı belirleyin
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
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
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
                Nitelik Başlığı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Acılık Seviyesi, Tuz Oranı, Fermantasyon Türü..."
                className="h-9 text-xs font-semibold bg-white"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFilterable}
                  onChange={(e) => setIsFilterable(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-900">
                    Vitrinde Filtre Olarak Gösterilsin
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Müşteriler kategori veya mağaza sayfasında ürünleri bu
                    niteliğe göre filtreleyebilsin (örn: Tatlı, Orta Acı, Ekşi).
                  </p>
                </div>
              </label>
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
              className="h-9 bg-emerald-700 px-4 text-[13px] font-semibold text-white shadow-2xs hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Kaydediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>💾</span>
                  <span>
                    {editingAttribute?.id
                      ? "Değişiklikleri Güncelle"
                      : "Niteliği Kaydet"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
