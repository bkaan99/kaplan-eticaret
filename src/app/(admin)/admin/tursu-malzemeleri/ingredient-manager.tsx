"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  formatSeasonRange,
  INGREDIENT_GROUP_LABELS,
  type CustomPickleConfig,
  type IngredientView,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { deleteIngredientAction, saveIngredientAction } from "./actions";
import { PickleOptionsManager } from "./pickle-options-manager";
import { EMPTY, toForm, toPayload, type FormState } from "./ingredient-form";
import { IngredientModal } from "./ingredient-modal";

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
      <div className="flex overflow-x-auto border-b border-slate-200 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setTab("ingredients")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer sm:px-5 ${
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
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer sm:px-5 ${
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
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer sm:px-5 ${
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
        <PickleOptionsManager initialOptions={options} activeSection={tab} />
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
              {ingredients.length === 0 ? (
                <div className="px-4 py-12 text-center text-slate-500">
                  <p className="mb-1 font-bold text-slate-800">
                    Henüz kayıtlı malzeme yok
                  </p>
                  <p className="mb-3 text-xs text-slate-400">
                    Yeni malzeme eklemek için butona tıklayın.
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateNew}
                    className="min-h-10 bg-emerald-700 text-xs font-semibold text-white"
                  >
                    + İlk Malzemeyi Ekle
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobil: kart listesi */}
                  <ul className="divide-y divide-slate-100 md:hidden">
                    {ingredients.map((item) => (
                      <li
                        key={item.id}
                        className={`flex flex-col gap-2.5 px-4 py-3.5 ${
                          item.isActive ? "" : "bg-slate-50/60 text-slate-400"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-contain p-1"
                              />
                            ) : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {INGREDIENT_GROUP_LABELS[item.group]} ·{" "}
                                  {formatMoney(item.pricePerKg)}/kg
                                </p>
                              </div>
                              <span
                                className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                  item.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-100 text-slate-500"
                                }`}
                              >
                                {item.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                              <span>
                                {item.stockKg !== null
                                  ? `${item.stockKg} kg`
                                  : "Limitsiz"}
                              </span>
                              {item.stockKg !== null && !item.inStock ? (
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-bold text-rose-700">
                                  Tükendi
                                </span>
                              ) : null}
                              {item.seasonStartMonth && item.seasonEndMonth ? (
                                <span>
                                  {formatSeasonRange(
                                    item.seasonStartMonth,
                                    item.seasonEndMonth,
                                  )}
                                </span>
                              ) : (
                                <span>Tüm yıl</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => edit(item)}
                            className="min-h-10 px-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActive(item)}
                            disabled={pending}
                            className="min-h-10 px-3 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            {item.isActive ? "Pasif yap" : "Aktif yap"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => remove(item)}
                            disabled={pending}
                            className="min-h-10 px-3 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            Sil
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Masaüstü: tablo */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Malzeme</th>
                          <th className="px-4 py-3">Grup</th>
                          <th className="px-4 py-3 text-right">TL / kg</th>
                          <th className="px-4 py-3">Stok Durumu</th>
                          <th className="px-4 py-3">Mevsim</th>
                          <th className="px-4 py-3">Durum</th>
                          <th className="px-4 py-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ingredients.map((item) => (
                          <tr
                            key={item.id}
                            className={
                              item.isActive
                                ? "hover:bg-slate-50/80 transition"
                                : "bg-slate-50/60 text-slate-400"
                            }
                          >
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-3">
                                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                            <td className="px-4 py-3">
                              {item.stockKg !== null ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-800">
                                    {item.stockKg} kg
                                  </span>
                                  {!item.inStock ? (
                                    <span className="inline-flex w-fit rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                      Tükendi
                                    </span>
                                  ) : item.isCriticalStock ? (
                                    <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                      Kritik Stok
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Limitsiz
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.seasonStartMonth && item.seasonEndMonth ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-slate-700">
                                    {formatSeasonRange(
                                      item.seasonStartMonth,
                                      item.seasonEndMonth,
                                    )}
                                  </span>
                                  {!item.inSeason ? (
                                    <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                      Mevsim Dışı
                                    </span>
                                  ) : (
                                    <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                      Mevsiminde
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Tüm Yıl
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  item.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-100 text-slate-500"
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
