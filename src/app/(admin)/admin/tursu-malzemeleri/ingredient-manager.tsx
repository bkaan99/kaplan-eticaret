"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
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

export function IngredientManager({
  ingredients,
  productId,
  initialOptions,
}: {
  ingredients: IngredientView[];
  productId: string | null;
  initialOptions?: CustomPickleConfig;
}) {
  const [tab, setTab] = useState<"ingredients" | "brines" | "spices">("ingredients");
  const options = initialOptions ?? {
    brines: DEFAULT_BRINE_CONFIG,
    spices: DEFAULT_SPICE_CONFIG,
  };
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function edit(item: IngredientView) {
    setEditingId(item.id);
    setForm(toForm(item));
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (result.ok && editingId === item.id) reset();
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
      {/* Üst Sekmeler */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("ingredients")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            tab === "ingredients"
              ? "border-primary text-primary"
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
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            tab === "brines"
              ? "border-primary text-primary"
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
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            tab === "spices"
              ? "border-primary text-primary"
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p>
              Bidon boyutları ve taban fiyatları{" "}
              <strong>“Kendi Turşunu Yap”</strong> ürününün varyantlarından
              yönetilir. Boyut adını <strong>“5 kg bidon”</strong> gibi kilo
              içerecek şekilde yazın; malzeme ücreti bu kiloya göre hesaplanır.
            </p>
            {productId ? (
              <Link
                href={`/admin/urunler/${productId}`}
                className="inline-flex h-9 shrink-0 items-center rounded-full bg-amber-900 px-4 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Bidon boyutlarını düzenle
              </Link>
            ) : (
              <span className="font-semibold">
                “kendi-tursunu-yap” adresli ürün bulunamadı
              </span>
            )}
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-bold text-slate-900">
          {editingId ? "Malzemeyi düzenle" : "Yeni malzeme"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Ad
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Örn. Kornişon"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Grup
            <select
              className={inputClass}
              value={form.group}
              onChange={(event) =>
                update("group", event.target.value as IngredientGroup)
              }
            >
              {(Object.keys(INGREDIENT_GROUP_LABELS) as IngredientGroup[]).map(
                (group) => (
                  <option key={group} value={group}>
                    {INGREDIENT_GROUP_LABELS[group]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Ek ücret (TL / kg)
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.pricePerKg}
              onChange={(event) => update("pricePerKg", event.target.value)}
              placeholder="Örn. 4,50"
            />
            {Number.isFinite(priceNumber) && priceNumber > 0 ? (
              <span className="font-normal text-slate-400">
                5 kg bidonda +{formatMoney(priceNumber * 5)}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Sıra
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(event) => update("sortOrder", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 sm:col-span-2">
            Açıklama (isteğe bağlı)
            <input
              className={inputClass}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 sm:col-span-2">
            Görsel
            <div className="flex items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {form.imageUrl ? (
                  <Image
                    src={form.imageUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                ) : null}
              </span>
              <input
                className={inputClass}
                value={form.imageUrl}
                onChange={(event) => update("imageUrl", event.target.value)}
                placeholder="/images/malzemeler/... veya dosya yükleyin"
                aria-label="Görsel adresi"
              />
              <label className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50">
                {uploading ? "Yükleniyor..." : "Yükle"}
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
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="mr-auto inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => update("isActive", event.target.checked)}
            />
            Müşteriler seçebilsin (aktif)
          </label>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Vazgeç
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={pending || uploading}
            className="h-10 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
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
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Henüz malzeme yok. Yukarıdaki formdan ekleyin.
                </td>
              </tr>
            ) : (
              ingredients.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.isActive ? "" : "bg-slate-50/60 text-slate-400"
                  }
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-50">
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
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {item.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex justify-end gap-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => edit(item)}
                        className="text-primary hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        disabled={pending}
                        className="text-slate-600 hover:underline"
                      >
                        {item.isActive ? "Pasif yap" : "Aktif yap"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        disabled={pending}
                        className="text-red-600 hover:underline"
                      >
                        Sil
                      </button>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      </>
      )}
    </div>
  );
}
