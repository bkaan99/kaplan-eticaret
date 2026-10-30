"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  INGREDIENT_GROUP_LABELS,
  type CustomPickleConfig,
  type IngredientGroup,
  type IngredientView,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { deleteIngredientAction, saveIngredientAction } from "./actions";
import { PickleOptionsManager } from "./pickle-options-manager";

interface FormState {
  name: string;
  group: IngredientGroup;
  pricePerKg: string;
  sortOrder: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  name: "",
  group: "VEGETABLE",
  pricePerKg: "",
  sortOrder: "0",
  description: "",
  imageUrl: "",
  isActive: true,
};

function toForm(item: IngredientView): FormState {
  return {
    name: item.name,
    group: item.group,
    pricePerKg: item.pricePerKg,
    sortOrder: String(item.sortOrder),
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? "",
    isActive: item.isActive,
  };
}

function toPayload(form: FormState) {
  return {
    name: form.name,
    group: form.group,
    pricePerKg: form.pricePerKg,
    sortOrder: form.sortOrder || "0",
    description: form.description,
    imageUrl: form.imageUrl,
    isActive: form.isActive,
  };
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10";

/* -------------------------------------------------------------------------- */
/*                              INGREDIENT MODAL                              */
/* -------------------------------------------------------------------------- */

interface IngredientModalProps {
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

function IngredientModal({
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
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
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

              <label className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition">
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
            className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={pending || uploading || !form.name.trim()}
            className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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

/* -------------------------------------------------------------------------- */
/*                             INGREDIENT MANAGER                             */
/* -------------------------------------------------------------------------- */

export function IngredientManager({
  ingredients,
  productId,
  initialOptions,
}: {
  ingredients: IngredientView[];
  productId: string | null;
  initialOptions?: CustomPickleConfig;
}) {
  const [tab, setTab] = useState<"ingredients" | "brines" | "spices">(
    "ingredients",
  );
  const options = initialOptions ?? {
    brines: DEFAULT_BRINE_CONFIG,
    spices: DEFAULT_SPICE_CONFIG,
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  function handleCreateNew() {
    reset();
    setIsModalOpen(true);
  }

  function edit(item: IngredientView) {
    setEditingId(item.id);
    setForm(toForm(item));
    setError(null);
    setNotice(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    reset();
    setIsModalOpen(false);
  }

  function save() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await saveIngredientAction(editingId, toPayload(form));
      if (!result.ok) {
        setError(result.error ?? "Kaydedilemedi");
        return;
      }
      setNotice(editingId ? "Malzeme güncellendi" : "Malzeme eklendi");
      reset();
      setIsModalOpen(false);
    });
  }

  function toggleActive(item: IngredientView) {
    startTransition(async () => {
      const result = await saveIngredientAction(item.id, {
        ...toPayload(toForm(item)),
        isActive: !item.isActive,
      });
      setNotice(null);
      setError(result.ok ? null : (result.error ?? "Güncellenemedi"));
    });
  }

  function remove(item: IngredientView) {
    if (
      !window.confirm(
        `"${item.name}" silinsin mi? Sepetinde bu malzeme olan müşteriler seçimlerini güncellemek zorunda kalır. Geçici olarak kaldırmak için "Pasif yap" seçeneğini kullanabilirsiniz.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteIngredientAction(item.id);
      setNotice(result.ok ? "Malzeme silindi" : null);
      setError(result.ok ? null : (result.error ?? "Silinemedi"));
      if (result.ok && editingId === item.id) {
        reset();
        setIsModalOpen(false);
      }
    });
  }

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/admin/yukle", { method: "POST", body });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        setError(result.error ?? "Yükleme başarısız");
        return;
      }
      update("imageUrl", result.url);
    } catch {
      setError("Yükleme başarısız, bağlantınızı kontrol edin");
    } finally {
      setUploading(false);
    }
  }

  const priceNumber = Number(form.pricePerKg.replace(",", "."));

  return (
    <div className="flex flex-col gap-6">
      {/* Malzeme Ekleme/Düzenleme Modalı */}
      <IngredientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingId={editingId}
        form={form}
        update={update}
        priceNumber={priceNumber}
        uploading={uploading}
        upload={upload}
        pending={pending}
        onSave={save}
        error={error}
      />

      {/* Üst Sekmeler */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("ingredients")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
            tab === "ingredients"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🥗 Sebze ve Baharatlar</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ingredients.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("brines")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
            tab === "brines"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🧪 Salamura Tarifleri</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {options.brines.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("spices")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
            tab === "spices"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🌶️ Acılık Seviyeleri</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {options.spices.length}
          </span>
        </button>
      </div>

      {tab !== "ingredients" ? (
        <PickleOptionsManager
          initialOptions={options}
          activeSection={tab}
        />
      ) : (
        <>
          {/* Bildirim Mesajları (Modal kapalıyken) */}
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

          {error && !isModalOpen && (
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

          {/* Bidon Bilgi Kutusu */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p>
              Bidon boyutları ve taban fiyatları{" "}
              <strong>“Kendi Turşunu Yap”</strong> ürününün varyantlarından
              yönetilir. Boyut adını <strong>“5 kg bidon”</strong> gibi kilo
              içerecek şekilde yazın; malzeme ücreti bu kiloya göre hesaplanır.
            </p>
            {productId ? (
              <Link
                href={`/admin/urunler/${productId}?tab=variants`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-amber-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
              >
                <span>Bidon boyutlarını düzenle</span>
                <span>↗</span>
              </Link>
            ) : (
              <span className="font-semibold">
                “kendi-tursunu-yap” adresli ürün bulunamadı
              </span>
            )}
          </div>

          {/* Malzeme Listesi Tablosu - Artık sayfa içinde açık form yok */}
          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Özel Turşu Malzemeleri Listesi
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Müşterilerin kendi turşularını hazırlarken seçebileceği sebze
                  ve ek lezzetler ({ingredients.length} kayıtlı)
                </p>
              </div>

              <Button
                type="button"
                onClick={handleCreateNew}
                className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
              >
                + Yeni Malzeme Ekle
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Malzeme</th>
                    <th className="px-4 py-3">Grup</th>
                    <th className="px-4 py-3 text-right">TL / kg</th>
                    <th className="px-4 py-3 text-right">5 kg bidonda</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        <p className="font-bold text-slate-800 mb-1">
                          Henüz kayıtlı malzeme yok
                        </p>
                        <p className="text-xs text-slate-400 mb-3">
                          Yeni malzeme eklemek için butona tıklayın.
                        </p>
                        <Button
                          type="button"
                          onClick={handleCreateNew}
                          className="bg-emerald-700 text-xs font-semibold text-white"
                        >
                          + İlk Malzemeyi Ekle
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          item.isActive ? "hover:bg-slate-50/80 transition" : "bg-slate-50/60 text-slate-400"
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-3">
                            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-200">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  className="object-contain p-1"
                                />
                              ) : null}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {item.name}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {INGREDIENT_GROUP_LABELS[item.group]}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(item.pricePerKg)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          +{formatMoney(Number(item.pricePerKg) * 5)}
                        </td>
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
                        <td className="px-4 py-3">
                          <span className="flex justify-end gap-2 text-xs font-semibold">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => edit(item)}
                              className="h-7 px-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActive(item)}
                              disabled={pending}
                              className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              {item.isActive ? "Pasif yap" : "Aktif yap"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => remove(item)}
                              disabled={pending}
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              Sil
                            </Button>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
