"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CustomPickleConfig,
  PickleBrineOption,
  PickleSpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import { savePickleOptionsAction } from "./actions";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

/* -------------------------------------------------------------------------- */
/*                                SPICE MODAL                                 */
/* -------------------------------------------------------------------------- */

interface SpiceModalProps {
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

function SpiceModal({
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
                {editingKey ? "Acılık Seviyesini Düzenle" : "Yeni Acılık Seviyesi Ekle"}
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
                  setSpiceKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
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
            <span>Bu acılık seviyesi müşterilere açık ve seçilebilir olsun</span>
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

/* -------------------------------------------------------------------------- */
/*                                BRINE MODAL                                 */
/* -------------------------------------------------------------------------- */

interface BrineModalProps {
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

function BrineModal({
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
                {editingKey ? "Salamura Tarifini Düzenle" : "Yeni Salamura Tarifi Ekle"}
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
                  setBrineKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
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
                Seçilirse bidon animasyonunda canlı probiyotik fermantasyon kabarcıkları yükselir.
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

/* -------------------------------------------------------------------------- */
/*                           PICKLE OPTIONS MANAGER                           */
/* -------------------------------------------------------------------------- */

export function PickleOptionsManager({
  initialOptions,
  activeSection,
}: {
  initialOptions: CustomPickleConfig;
  activeSection: "brines" | "spices";
}) {
  const [options, setOptions] = useState<CustomPickleConfig>(initialOptions);

  // Modallar
  const [isBrineModalOpen, setIsBrineModalOpen] = useState(false);
  const [isSpiceModalOpen, setIsSpiceModalOpen] = useState(false);

  const [editingBrineKey, setEditingBrineKey] = useState<string | null>(null);
  const [editingSpiceKey, setEditingSpiceKey] = useState<string | null>(null);

  // Salamura formu
  const [brineKey, setBrineKey] = useState("");
  const [brineLabel, setBrineLabel] = useState("");
  const [brineDescription, setBrineDescription] = useState("");
  const [brineColor, setBrineColor] = useState("#d6e29a");
  const [brineHasBubbles, setBrineHasBubbles] = useState(false);
  const [brineSortOrder, setBrineSortOrder] = useState("0");
  const [brineIsActive, setBrineIsActive] = useState(true);

  // Acılık formu
  const [spiceKey, setSpiceKey] = useState("");
  const [spiceLabel, setSpiceLabel] = useState("");
  const [spiceDescription, setSpiceDescription] = useState("");
  const [spicePeppers, setSpicePeppers] = useState("1");
  const [spiceTint, setSpiceTint] = useState("0.1");
  const [spiceSortOrder, setSpiceSortOrder] = useState("0");
  const [spiceIsActive, setSpiceIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* ------------------------------ BRINE HANDLERS ----------------------------- */

  function resetBrineForm() {
    setEditingBrineKey(null);
    setBrineKey("");
    setBrineLabel("");
    setBrineDescription("");
    setBrineColor("#d6e29a");
    setBrineHasBubbles(false);
    setBrineSortOrder("0");
    setBrineIsActive(true);
    setError(null);
  }

  function handleCreateNewBrine() {
    resetBrineForm();
    setIsBrineModalOpen(true);
  }

  function handleCloseBrineModal() {
    setIsBrineModalOpen(false);
    resetBrineForm();
  }

  function editBrine(item: PickleBrineOption) {
    setEditingBrineKey(item.key);
    setBrineKey(item.key);
    setBrineLabel(item.label);
    setBrineDescription(item.description);
    setBrineColor(item.color);
    setBrineHasBubbles(Boolean(item.hasBubbles));
    setBrineSortOrder(String(item.sortOrder));
    setBrineIsActive(item.isActive);
    setError(null);
    setNotice(null);
    setIsBrineModalOpen(true);
  }

  /* ------------------------------ SPICE HANDLERS ----------------------------- */

  function resetSpiceForm() {
    setEditingSpiceKey(null);
    setSpiceKey("");
    setSpiceLabel("");
    setSpiceDescription("");
    setSpicePeppers("1");
    setSpiceTint("0.1");
    setSpiceSortOrder("0");
    setSpiceIsActive(true);
    setError(null);
  }

  function handleCreateNewSpice() {
    resetSpiceForm();
    setIsSpiceModalOpen(true);
  }

  function handleCloseSpiceModal() {
    setIsSpiceModalOpen(false);
    resetSpiceForm();
  }

  function editSpice(item: PickleSpiceOption) {
    setEditingSpiceKey(item.key);
    setSpiceKey(item.key);
    setSpiceLabel(item.label);
    setSpiceDescription(item.description ?? "");
    setSpicePeppers(String(item.peppers));
    setSpiceTint(String(item.tint));
    setSpiceSortOrder(String(item.sortOrder));
    setSpiceIsActive(item.isActive);
    setError(null);
    setNotice(null);
    setIsSpiceModalOpen(true);
  }

  /* ------------------------------ PERSISTENCE ------------------------------ */

  async function persistConfig(
    newConfig: CustomPickleConfig,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await savePickleOptionsAction(newConfig);
      if (!result.ok) {
        setError(result.error ?? "Ayarlar kaydedilemedi");
        return;
      }
      setOptions(newConfig);
      setNotice(successMessage);
      onSuccess?.();
    });
  }

  function saveBrine() {
    const key = (brineKey || brineLabel.toUpperCase().replace(/[^A-Z0-9]/g, "_")).trim();
    if (!key || !brineLabel.trim()) {
      setError("Anahtar ve etiket zorunludur");
      return;
    }

    const newItem: PickleBrineOption = {
      key,
      label: brineLabel.trim(),
      description: brineDescription.trim(),
      color: brineColor.trim() || "#d6e29a",
      hasBubbles: brineHasBubbles,
      sortOrder: Number(brineSortOrder) || 0,
      isActive: brineIsActive,
    };

    let nextBrines: PickleBrineOption[];
    if (editingBrineKey) {
      nextBrines = options.brines.map((item) =>
        item.key === editingBrineKey ? newItem : item,
      );
    } else {
      if (options.brines.some((item) => item.key === key)) {
        setError(`"${key}" anahtarı zaten mevcut. Lütfen benzersiz bir anahtar seçin.`);
        return;
      }
      nextBrines = [...options.brines, newItem];
    }

    nextBrines.sort((a, b) => a.sortOrder - b.sortOrder);
    const newConfig = { ...options, brines: nextBrines };
    persistConfig(
      newConfig,
      editingBrineKey ? "Salamura tarifi güncellendi" : "Yeni salamura tarifi eklendi",
      () => {
        setIsBrineModalOpen(false);
        resetBrineForm();
      },
    );
  }

  function deleteBrine(key: string) {
    if (options.brines.length <= 1) {
      setError("En az bir salamura seçeneği kalmalıdır");
      return;
    }
    if (!window.confirm("Bu salamura seçeneğini silmek istediğinizden emin misiniz?")) {
      return;
    }
    const nextBrines = options.brines.filter((item) => item.key !== key);
    persistConfig({ ...options, brines: nextBrines }, "Salamura seçeneği silindi");
    if (editingBrineKey === key) resetBrineForm();
  }

  function toggleBrineActive(item: PickleBrineOption) {
    const nextBrines = options.brines.map((b) =>
      b.key === item.key ? { ...b, isActive: !b.isActive } : b,
    );
    persistConfig(
      { ...options, brines: nextBrines },
      item.isActive ? "Salamura pasife alındı" : "Salamura aktife alındı",
    );
  }

  function saveSpice() {
    const key = (spiceKey || spiceLabel.toUpperCase().replace(/[^A-Z0-9]/g, "_")).trim();
    if (!key || !spiceLabel.trim()) {
      setError("Anahtar ve etiket zorunludur");
      return;
    }

    const newItem: PickleSpiceOption = {
      key,
      label: spiceLabel.trim(),
      description: spiceDescription.trim() || null,
      peppers: Math.max(0, Math.min(5, Number(spicePeppers) || 0)),
      tint: Math.max(0, Math.min(1, Number(spiceTint) || 0)),
      sortOrder: Number(spiceSortOrder) || 0,
      isActive: spiceIsActive,
    };

    let nextSpices: PickleSpiceOption[];
    if (editingSpiceKey) {
      nextSpices = options.spices.map((item) =>
        item.key === editingSpiceKey ? newItem : item,
      );
    } else {
      if (options.spices.some((item) => item.key === key)) {
        setError(`"${key}" anahtarı zaten mevcut. Lütfen benzersiz bir anahtar seçin.`);
        return;
      }
      nextSpices = [...options.spices, newItem];
    }

    nextSpices.sort((a, b) => a.sortOrder - b.sortOrder);
    const newConfig = { ...options, spices: nextSpices };
    persistConfig(
      newConfig,
      editingSpiceKey ? "Acılık seviyesi güncellendi" : "Yeni acılık seviyesi eklendi",
      () => {
        setIsSpiceModalOpen(false);
        resetSpiceForm();
      },
    );
  }

  function deleteSpice(key: string) {
    if (options.spices.length <= 1) {
      setError("En az bir acılık seçeneği kalmalıdır");
      return;
    }
    if (!window.confirm("Bu acılık seviyesini silmek istediğinizden emin misiniz?")) {
      return;
    }
    const nextSpices = options.spices.filter((item) => item.key !== key);
    persistConfig({ ...options, spices: nextSpices }, "Acılık seviyesi silindi");
    if (editingSpiceKey === key) resetSpiceForm();
  }

  function toggleSpiceActive(item: PickleSpiceOption) {
    const nextSpices = options.spices.map((s) =>
      s.key === item.key ? { ...s, isActive: !s.isActive } : s,
    );
    persistConfig(
      { ...options, spices: nextSpices },
      item.isActive ? "Acılık pasife alındı" : "Acılık aktife alındı",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Modallar */}
      <SpiceModal
        isOpen={isSpiceModalOpen}
        onClose={handleCloseSpiceModal}
        editingKey={editingSpiceKey}
        label={spiceLabel}
        setLabel={setSpiceLabel}
        spiceKey={spiceKey}
        setSpiceKey={setSpiceKey}
        description={spiceDescription}
        setDescription={setSpiceDescription}
        peppers={spicePeppers}
        setPeppers={setSpicePeppers}
        tint={spiceTint}
        setTint={setSpiceTint}
        sortOrder={spiceSortOrder}
        setSortOrder={setSpiceSortOrder}
        isActive={spiceIsActive}
        setIsActive={setSpiceIsActive}
        pending={pending}
        onSave={saveSpice}
        error={error}
      />

      <BrineModal
        isOpen={isBrineModalOpen}
        onClose={handleCloseBrineModal}
        editingKey={editingBrineKey}
        label={brineLabel}
        setLabel={setBrineLabel}
        brineKey={brineKey}
        setBrineKey={setBrineKey}
        description={brineDescription}
        setDescription={setBrineDescription}
        color={brineColor}
        setColor={setBrineColor}
        hasBubbles={brineHasBubbles}
        setHasBubbles={setBrineHasBubbles}
        sortOrder={brineSortOrder}
        setSortOrder={setBrineSortOrder}
        isActive={brineIsActive}
        setIsActive={setBrineIsActive}
        pending={pending}
        onSave={saveBrine}
        error={error}
      />

      {/* Bildirimler (Modallar kapalıyken) */}
      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between"
        >
          <span>✓ {notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && !isSpiceModalOpen && !isBrineModalOpen && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center justify-between"
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {activeSection === "brines" ? (
        /* SALAMURA TARİFLERİ TABLOSU */
        <Card className="overflow-hidden border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tanımlı Salamura Tarifleri
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Müşterilerin turşu bidonuna seçeceği salamura suyunun bileşimi ve rengi ({options.brines.length} kayıtlı)
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCreateNewBrine}
              className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
            >
              + Yeni Salamura Tarifi
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tarif</th>
                    <th className="px-4 py-3">Anahtar</th>
                    <th className="px-4 py-3">Renk</th>
                    <th className="px-4 py-3">Kabarcık</th>
                    <th className="px-4 py-3">Sıra</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {options.brines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                        Kayıtlı salamura tarifi bulunamadı. "+ Yeni Salamura Tarifi" butonu ile ekleyin.
                      </td>
                    </tr>
                  ) : (
                    options.brines.map((item) => (
                      <tr
                        key={item.key}
                        className={`transition-colors hover:bg-slate-50/60 ${
                          item.isActive ? "" : "bg-slate-50/60 text-slate-400 opacity-70"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {item.label}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {item.key}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-5 w-5 rounded-full border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-mono text-xs">{item.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.hasBubbles ? (
                            <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-200">
                              Kabarcıklı
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{item.sortOrder}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {item.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => editBrine(item)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBrineActive(item)}
                              disabled={pending}
                              className="text-slate-600 hover:underline cursor-pointer disabled:opacity-50"
                            >
                              {item.isActive ? "Pasif yap" : "Aktif yap"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBrine(item.key)}
                              disabled={pending}
                              className="text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ACILIK SEVİYELERİ TABLOSU */
        <Card className="overflow-hidden border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tanımlı Acılık Seviyeleri
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Müşterilerin turşu bidonuna katmak istediği acılık derecesi ve görsel biber ikonu ({options.spices.length} kayıtlı)
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCreateNewSpice}
              className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
            >
              + Yeni Acılık Seviyesi
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Seviye</th>
                    <th className="px-4 py-3">Anahtar</th>
                    <th className="px-4 py-3">Biber Sayısı</th>
                    <th className="px-4 py-3">Kızarıklık</th>
                    <th className="px-4 py-3">Sıra</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {options.spices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                        Kayıtlı acılık seviyesi bulunamadı. "+ Yeni Acılık Seviyesi" butonu ile ekleyin.
                      </td>
                    </tr>
                  ) : (
                    options.spices.map((item) => (
                      <tr
                        key={item.key}
                        className={`transition-colors hover:bg-slate-50/60 ${
                          item.isActive ? "" : "bg-slate-50/60 text-slate-400 opacity-70"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {item.label}
                            </span>
                            {item.description ? (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {item.key}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 font-semibold text-red-500">
                            {"🌶️".repeat(item.peppers) || (
                              <span className="font-normal text-slate-400">Yok (0)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-2xs"
                              style={{
                                backgroundColor: `rgba(220, 38, 38, ${Math.max(0.1, item.tint)})`,
                              }}
                            />
                            <span className="font-mono text-xs">
                              %{Math.round(item.tint * 100)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{item.sortOrder}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {item.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => editSpice(item)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSpiceActive(item)}
                              disabled={pending}
                              className="text-slate-600 hover:underline cursor-pointer disabled:opacity-50"
                            >
                              {item.isActive ? "Pasif yap" : "Aktif yap"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSpice(item.key)}
                              disabled={pending}
                              className="text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
