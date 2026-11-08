"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "./pickle-ui";

export interface SpiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingKey: string | null;
  label: string;
  setLabel: (v: string) => void;
  spiceKey: string;
  setSpiceKey: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  peppers: string;
  setPeppers: (v: string) => void;
  tint: string;
  setTint: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  pending: boolean;
  onSave: () => void;
  error: string | null;
}

export function SpiceModal({
  isOpen,
  onClose,
  editingKey,
  label,
  setLabel,
  spiceKey,
  setSpiceKey,
  description,
  setDescription,
  peppers,
  setPeppers,
  tint,
  setTint,
  sortOrder,
  setSortOrder,
  isActive,
  setIsActive,
  pending,
  onSave,
  error,
}: SpiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pepperCount = Math.max(0, Math.min(5, Number(peppers) || 0));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-red-50/40 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-lg shadow-2xs">
              🌶️
            </span>
            <div>
              <h2
                id="spice-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingKey
                  ? "Acılık Seviyesini Düzenle"
                  : "Yeni Acılık Seviyesi Ekle"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingKey
                  ? `"${label || editingKey}" seviyesini güncelliyorsunuz`
                  : "Müşterilerin turşu bidonuna seçeceği acılık derecesi ve görsel biber ikonu"}
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

        {/* Modal Body */}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Seviye Adı / Etiket <span className="text-red-500">*</span>
              <input
                autoFocus
                type="text"
                placeholder="örn: Acısız, Orta Acı, Çok Acılı (Atom)"
                className={inputClass}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Sistem Anahtarı (KEY) <span className="text-red-500">*</span>
              <input
                type="text"
                placeholder="örn: MILD, MEDIUM, HOT, ATOM"
                className={inputClass}
                value={spiceKey}
                disabled={Boolean(editingKey)}
                onChange={(e) =>
                  setSpiceKey(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  )
                }
              />
              <span className="font-normal text-slate-400 text-[11px]">
                {editingKey
                  ? "Sistem anahtarı düzenlenemez"
                  : "Büyük harf ve alt çizgi (örn: MILD, HOT)"}
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
            Açıklama / Müşteri Bilgisi (İsteğe bağlı)
            <input
              type="text"
              placeholder="örn: Damakta iz bırakan geleneksel acı lezzet..."
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between">
                <span>Biber İkon Sayısı (0-5)</span>
                <span className="font-bold text-red-500">
                  {pepperCount > 0 ? "🌶️".repeat(pepperCount) : "Acısız (0)"}
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="5"
                className={inputClass}
                value={peppers}
                onChange={(e) => setPeppers(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Sıralama Önceliği
              <input
                type="number"
                className={inputClass}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <span className="font-normal text-slate-400 text-[11px]">
                Listede ve seçim alanında görüntülenme sırası
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Bidon Kızarıklık Tonu Geçirgenliği</span>
              <span className="rounded-md bg-red-100 px-2 py-0.5 font-mono text-[11px] font-bold text-red-700">
                %{Math.round(Number(tint) * 100)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                className="h-2 w-full cursor-pointer accent-red-600"
                value={tint}
                onChange={(e) => setTint(e.target.value)}
              />
              <div
                className="h-7 w-12 shrink-0 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                style={{
                  backgroundColor: `rgba(220, 38, 38, ${Math.max(0.05, Number(tint))})`,
                }}
                title="Sıvı kızarıklık tonu önizlemesi"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Özel turşu robotunda bidon sıvısına eklenecek kırmızı ton oranı.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100/60 transition">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Bu acılık seviyesi müşterilere açık ve seçilebilir olsun
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
            className="h-9 px-4 text-xs font-semibold cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="h-9 bg-emerald-700 px-5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer disabled:opacity-50"
          >
            {pending
              ? "Kaydediliyor..."
              : editingKey
                ? "Değişiklikleri Kaydet"
                : "Acılık Seviyesi Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
