"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAttributeValueAction, updateAttributeValueAction } from "./actions";
import { type AttributeView } from "./attribute-types";

export interface ValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: AttributeView | null;
  editingValue: { id: string; value: string } | null;
  onSuccess?: () => void;
}

export function AttributeValueModal({
  isOpen,
  onClose,
  attribute,
  editingValue,
  onSuccess,
}: ValueModalProps) {
  const { pending, error, run, setError } = useActionRunner();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setValue(editingValue?.value ?? "");

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
  }, [isOpen, onClose, setError, editingValue]);

  if (!isOpen || !attribute) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || !attribute) return;

    run(
      () =>
        editingValue
          ? updateAttributeValueAction(editingValue.id, value.trim())
          : addAttributeValueAction(attribute.id, value.trim()),
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
      aria-labelledby="value-modal-title"
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
              id="value-modal-title"
              className="text-[15px] font-semibold text-slate-900"
            >
              {editingValue ? "Değeri düzenle" : "Yeni değer"}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              “{attribute.name}” niteliği için seçenek.
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
                Değer <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Örn. Az acılı"
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
            <Button type="submit" disabled={pending || !value.trim()}>
              {pending
                ? "Kaydediliyor…"
                : editingValue
                  ? "Güncelle"
                  : "Ekle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
