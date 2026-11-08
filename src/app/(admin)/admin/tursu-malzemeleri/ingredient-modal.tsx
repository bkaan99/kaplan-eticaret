"use client";

import { inputClass } from "./pickle-ui";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  INGREDIENT_GROUP_LABELS,
  MONTH_NAMES_TR,
  type IngredientGroup,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { type FormState } from "./ingredient-form";

export interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  priceNumber: number;
  uploading: boolean;
  upload: (file: File) => Promise<void>;
  pending: boolean;
  onSave: () => void;
  error: string | null;
}

export function IngredientModal({
  isOpen,
  onClose,
  editingId,
  form,
  update,
  priceNumber,
  uploading,
  upload,
  pending,
  onSave,
  error,
}: IngredientModalProps) {
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
      aria-labelledby="ingredient-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🥒
            </span>
            <div>
              <h2
                id="ingredient-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingId ? "Malzemeyi Düzenle" : "Yeni Malzeme Tanımla"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingId
                  ? `"${form.name}" malzemesini güncelliyorsunuz`
                  : "Özel turşu robotuna yeni bir sebze veya ek malzeme ekleyin"}
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

        {/* Modal Form Body */}
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
              Malzeme Adı <span className="text-red-500">*</span>
              <input
                autoFocus
                className={inputClass}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Örn: Kornişon, Kelek, Acur..."
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Malzeme Grubu <span className="text-red-500">*</span>
              <select
                className={inputClass}
                value={form.group}
                onChange={(event) =>
                  update("group", event.target.value as IngredientGroup)
                }
              >
                {(
                  Object.keys(INGREDIENT_GROUP_LABELS) as IngredientGroup[]
                ).map((group) => (
                  <option key={group} value={group}>
                    {INGREDIENT_GROUP_LABELS[group]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Ek Ücret (TL / kg)
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.pricePerKg}
                onChange={(event) => update("pricePerKg", event.target.value)}
                placeholder="Örn: 4,50"
              />
              {Number.isFinite(priceNumber) && priceNumber > 0 ? (
                <span className="font-normal text-emerald-600 text-[11px]">
                  5 kg bidonda +{formatMoney(priceNumber * 5)} yansır
                </span>
              ) : (
                <span className="font-normal text-slate-400 text-[11px]">
                  0 veya boş bırakılırsa taban fiyata dahil sayılır
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Görüntüleme Sırası
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(event) => update("sortOrder", event.target.value)}
                placeholder="0"
              />
            </label>
          </div>

          {/* Stok Yönetimi */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Mevcut Stok (kg)
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.stockKg}
                onChange={(event) => update("stockKg", event.target.value)}
                placeholder="Örn: 50 (Boş bırakılırsa limitsiz)"
              />
              <span className="font-normal text-slate-400 text-[11px]">
                0 veya daha az girilirse robotta &quot;Tükendi&quot; görünür.
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              Kritik Stok Uyarısı (kg)
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.minStockKg}
                onChange={(event) => update("minStockKg", event.target.value)}
                placeholder="Örn: 10 (Boş bırakılırsa uyarı yok)"
              />
              <span className="font-normal text-slate-400 text-[11px]">
                Stok bu miktarın altına düşerse kritik stok uyarısı verilir.
              </span>
            </label>
          </div>

          {/* Mevsimsellik Takibi */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                🌿 Mevsimsellik Takibi
              </span>
              <span className="text-[11px] text-slate-500">
                Boş bırakılırsa tüm yıl mevsiminde sayılır
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Mevsim Başlangıç Ayı
                <select
                  className={inputClass}
                  value={form.seasonStartMonth}
                  onChange={(event) =>
                    update("seasonStartMonth", event.target.value)
                  }
                >
                  <option value="">(Seçilmedi - Tüm Yıl)</option>
                  {MONTH_NAMES_TR.map((month, index) => (
                    <option key={index + 1} value={String(index + 1)}>
                      {month} ({index + 1}. Ay)
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Mevsim Bitiş Ayı
                <select
                  className={inputClass}
                  value={form.seasonEndMonth}
                  onChange={(event) =>
                    update("seasonEndMonth", event.target.value)
                  }
                >
                  <option value="">(Seçilmedi - Tüm Yıl)</option>
                  {MONTH_NAMES_TR.map((month, index) => (
                    <option key={index + 1} value={String(index + 1)}>
                      {month} ({index + 1}. Ay)
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
            Açıklama (İsteğe bağlı)
            <input
              className={inputClass}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Örn: Çıtır Çubuk kornişonu, taze hasat..."
            />
          </label>

          {/* Görsel Yükleme / URL */}
          <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
            <span>Malzeme Görseli</span>
            <div className="flex items-center gap-3">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs">
                {form.imageUrl ? (
                  <Image
                    src={form.imageUrl}
                    alt="Malzeme"
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    🥒
                  </span>
                )}
              </span>

              <input
                className={`${inputClass} flex-1`}
                value={form.imageUrl}
                onChange={(event) => update("imageUrl", event.target.value)}
                placeholder="/images/malzemeler/... veya dosya yükleyin"
                aria-label="Görsel adresi"
              />

              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition">
                {uploading ? "Yükleniyor..." : "📁 Dosya Seç"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {/* Aktiflik Durumu */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-900">
                  Müşteriler seçebilsin (Aktif Malzeme)
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  İşaretli olduğunda turşu robotu seçim ekranında listelenir ve
                  siparişe eklenebilir.
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
            disabled={pending || uploading}
            className="h-9 px-3.5 text-[13px] font-medium text-slate-600 hover:bg-white cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={pending || uploading || !form.name.trim()}
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
                <span>{editingId ? "Güncelle" : "Malzemeyi Kaydet"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
