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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="attribute-modal-title"
              className="text-[15px] font-semibold text-slate-900"
            >
              {editingAttribute?.id ? "Niteliği düzenle" : "Yeni nitelik"}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Ürün filtreleme ve varyasyon için özellik başlığı.
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
                Nitelik adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn. Acılık seviyesi"
                className="bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 select-none">
              <input
                type="checkbox"
                checked={isFilterable}
                onChange={(e) => setIsFilterable(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-[13px] font-semibold text-slate-900">
                  Vitrinde filtre olarak göster
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">
                  Müşteriler mağaza ve kategori sayfalarında bu niteliğe göre
                  süzebilir.
                </span>
              </span>
            </label>
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
                : editingAttribute?.id
                  ? "Güncelle"
                  : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
