"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "./pickle-ui";

export interface BrineModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingKey: string | null;
  label: string;
  setLabel: (v: string) => void;
  brineKey: string;
  setBrineKey: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  hasBubbles: boolean;
  setHasBubbles: (v: boolean) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  pending: boolean;
  onSave: () => void;
  error: string | null;
}

export function BrineModal({
  isOpen,
  onClose,
  editingKey,
  label,
  setLabel,
  brineKey,
  setBrineKey,
  description,
  setDescription,
  color,
  setColor,
  hasBubbles,
  setHasBubbles,
  sortOrder,
  setSortOrder,
  isActive,
  setIsActive,
  pending,
  onSave,
  error,
}: BrineModalProps) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brine-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/40 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🧪
            </span>
            <div>
              <h2
                id="brine-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingKey
                  ? "Salamura Tarifini Düzenle"
                  : "Yeni Salamura Tarifi Ekle"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingKey
                  ? `"${label || editingKey}" tarifini güncelliyorsunuz`
                  : "Müşterilerin turşu bidonuna seçeceği salamura suyunun bileşimi ve rengi"}
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
              Tarif Adı / Etiket <span className="text-red-500">*</span>
              <input
                autoFocus
                type="text"
                placeholder="örn: Elma Sirkeli & Kaya Tuzlu"
                className={inputClass}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Sistem Anahtarı (KEY) <span className="text-red-500">*</span>
              <input
                type="text"
                placeholder="örn: APPLE_CIDER, LEMON_SALT"
                className={inputClass}
                value={brineKey}
                disabled={Boolean(editingKey)}
                onChange={(e) =>
                  setBrineKey(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  )
                }
              />
              <span className="font-normal text-slate-400 text-[11px]">
                {editingKey
                  ? "Sistem anahtarı düzenlenemez"
                  : "Büyük harf ve alt çizgi (örn: VINEGAR, NATURAL)"}
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
            Açıklama / Müşteri Bilgisi
            <textarea
              rows={2}
              placeholder="Geleneksel sirke ve kaya tuzu dengesi, probiyotik fermantasyon..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Bidon Sıvı Rengi
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <input
                  type="text"
                  className={inputClass}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
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

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100/60 transition">
            <input
              type="checkbox"
              checked={hasBubbles}
              onChange={(e) => setHasBubbles(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="flex flex-col gap-0.5">
              <span>Doğal Probiyotik Fermantasyon Kabarcıkları</span>
              <span className="font-normal text-slate-500 text-[11px]">
                Seçilirse bidon animasyonunda canlı probiyotik fermantasyon
                kabarcıkları yükselir.
              </span>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100/60 transition">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Bu salamura türü müşterilere açık ve seçilebilir olsun</span>
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
                : "Salamura Tarifi Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
