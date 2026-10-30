"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bidonWeightGram } from "@/modules/custom-pickle/custom-pickle.types";
import { Field } from "./product-form-field";
import { parseValues, type OptionRow, type VariantRow } from "./use-product-form";

interface ProductVariantsSectionProps {
  options: OptionRow[];
  setOptions: React.Dispatch<React.SetStateAction<OptionRow[]>>;
  variants: VariantRow[];
  updateVariant: (index: number, patch: Partial<VariantRow>) => void;
  generateVariants: () => void;
  fieldErrors: Record<string, string>;
  isCustomPickle?: boolean;
}

const COMMON_PICKLE_SIZES = [
  "1 kg kavanoz",
  "2 kg bidon",
  "3 kg bidon",
  "5 kg bidon",
  "10 kg bidon",
  "15 kg bidon",
];

export function ProductVariantsSection({
  options,
  setOptions,
  variants,
  updateVariant,
  generateVariants,
  fieldErrors,
  isCustomPickle = false,
}: ProductVariantsSectionProps) {
  const currentSizes = useMemo(() => {
    const boyOption =
      options.find((o) => o.name.trim().toLowerCase() === "boyut") ?? options[0];
    return boyOption ? parseValues(boyOption.values) : [];
  }, [options]);

  function handleAddQuickSize(sizeLabel: string) {
    setOptions((rows) => {
      if (rows.length === 0) {
        return [{ name: "Boyut", values: sizeLabel }];
      }
      const targetIndex = rows.findIndex(
        (r) => r.name.trim().toLowerCase() === "boyut",
      );
      const idx = targetIndex >= 0 ? targetIndex : 0;
      const target = rows[idx]!;
      const existing = parseValues(target.values);
      if (existing.some((val) => val.toLowerCase() === sizeLabel.toLowerCase())) {
        return rows;
      }
      const updatedValues = [...existing, sizeLabel].join(", ");
      return rows.map((r, i) =>
        i === idx ? { ...r, values: updatedValues } : r,
      );
    });
  }

  function handleRemoveSize(sizeToRemove: string) {
    setOptions((rows) => {
      const targetIndex = rows.findIndex(
        (r) => r.name.trim().toLowerCase() === "boyut",
      );
      const idx = targetIndex >= 0 ? targetIndex : 0;
      const target = rows[idx];
      if (!target) return rows;
      const existing = parseValues(target.values);
      const filtered = existing.filter(
        (val) => val.toLowerCase() !== sizeToRemove.toLowerCase(),
      );
      return rows.map((r, i) =>
        i === idx ? { ...r, values: filtered.join(", ") } : r,
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Özel Kendi Turşunu Yap Bilgilendirme Kartı */}
      {isCustomPickle && (
        <div className="rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50/90 to-amber-100/40 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">
              🏺
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Bidon Boyutları ve Taban Satış Fiyatları
              </h3>
              <p className="text-xs leading-relaxed text-amber-900/80">
                Müşteriler turşu kurmaya başlarken ilk olarak buradan tanımlanan bir bidon boyutu seçer.
                Girdiğiniz <strong>Fiyat</strong>, o boyuttaki boş bidonun taban tutarıdır.
                Müşteri sebze ve baharat eklediğinde, o malzemenin kilo başı ücreti
                buradaki <strong>bidon ağırlığı (kg)</strong> ile çarpılarak sepete eklenir.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 text-[11px] text-amber-800 font-semibold">
                <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5">
                  Örnek: 5 kg bidonda 8 ₺/kg kornişon = +40 ₺ ek ücret
                </span>
                <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5">
                  Boyut adını &quot;5 kg bidon&quot; veya &quot;1 kg kavanoz&quot; şeklinde yazınız
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seçenekler Kartı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              {isCustomPickle ? "Bidon Boyut Seçenekleri" : "Seçenekler ve Değerler"}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCustomPickle
                ? "Bidon seçeneklerini virgülle ayırarak yazabilir veya aşağıdaki hızlı butonları kullanabilirsiniz."
                : "Her seçenek için değerleri virgülle ayırın (örn. Boyut: 1 kg, 3 kg, 5 kg)."}
            </p>
          </div>
          {isCustomPickle && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {currentSizes.length} Boyut Tanımlı
            </span>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Hızlı Boyut Ekleme Butonları (Özellikle Turşu Bidonları İçin) */}
          {isCustomPickle && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-xs font-bold text-slate-700">
                Hızlı Boyut Ekle:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_PICKLE_SIZES.map((size) => {
                  const alreadyExists = currentSizes.some(
                    (s) => s.toLowerCase() === size.toLowerCase(),
                  );
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={alreadyExists}
                      onClick={() => handleAddQuickSize(size)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        alreadyExists
                          ? "bg-slate-200/60 text-slate-400 cursor-default"
                          : "bg-white border border-slate-200 text-slate-700 shadow-2xs hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 cursor-pointer"
                      }`}
                    >
                      <span>{alreadyExists ? "✓" : "+"}</span>
                      <span>{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dinamik Seçenek Satırları */}
          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="grid items-end gap-3 rounded-xl border border-slate-200/70 bg-slate-50/40 p-3.5 sm:grid-cols-[180px_1fr_auto]"
              >
                <Field label="Seçenek Adı" hint="Örn: Boyut">
                  <Input
                    value={option.name}
                    className="h-9.5 text-xs font-medium"
                    onChange={(e) =>
                      setOptions((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, name: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="Boyut"
                  />
                </Field>
                <Field
                  label="Değerler (Virgülle Ayırın)"
                  hint="Örn: 3 kg bidon, 5 kg bidon"
                >
                  <Input
                    value={option.values}
                    className="h-9.5 text-xs font-medium"
                    onChange={(e) =>
                      setOptions((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, values: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="3 kg bidon, 5 kg bidon, 10 kg bidon"
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() =>
                    setOptions((rows) => rows.filter((_, i) => i !== index))
                  }
                >
                  Sil
                </Button>
              </div>
            ))}
          </div>

          {fieldErrors["options"] && (
            <span role="alert" className="text-xs font-medium text-red-600">
              {fieldErrors["options"]}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isCustomPickle && options.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  setOptions((rows) => [...rows, { name: "", values: "" }])
                }
              >
                + Yeni Seçenek Ekle
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={generateVariants}
              className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs"
            >
              🔄 Seçeneklerden Varyantları / Boyutları Güncelle
            </Button>
            <span className="text-xs text-slate-400">
              (Yeni boyut eklediğinizde veya sildiğinizde listeyi yenilemek için tıklayın)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tanımlı Varyantlar / Bidon Boyutları Tablosu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              {isCustomPickle ? "Tanımlı Bidon Boyutları ve Fiyat Tablosu" : "Oluşturulan Varyantlar"}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Her boyutun taban satış fiyatını, stok miktarını ve mağaza yayında durumunu buradan düzenleyin.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {variants.length} Satır
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {variants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200/80 bg-slate-50/80 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3 min-w-[200px]">
                      {isCustomPickle ? "Bidon Boyutu / Ağırlık" : "Varyant / Seçenek"}
                    </th>
                    <th className="px-3 py-3 min-w-[150px]">SKU Kodu</th>
                    <th className="px-3 py-3 min-w-[125px]">Taban Fiyat (₺)</th>
                    <th className="px-3 py-3 min-w-[125px]">Eski Fiyat (₺)</th>
                    <th className="px-3 py-3 min-w-[120px]">Stok Adedi</th>
                    <th className="px-3 py-3 min-w-[110px] text-center">Durum</th>
                    {isCustomPickle && <th className="px-3 py-3 w-12 text-center">Kaldır</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {variants.map((variant, index) => {
                    const label =
                      Object.values(variant.optionValues).join(" / ") ||
                      "Standart Boyut";
                    const weightG = isCustomPickle
                      ? bidonWeightGram(null, label)
                      : null;
                    const weightKg = weightG
                      ? (weightG / 1000).toLocaleString("tr-TR")
                      : "1";
                    const stockNum = Number(variant.stockQuantity) || 0;

                    return (
                      <tr
                        key={variant.id ?? `new-${index}`}
                        className={`transition-colors hover:bg-slate-50/60 ${
                          !variant.isActive ? "opacity-60 bg-slate-50/30" : ""
                        }`}
                      >
                        {/* Boyut / Seçenek Bilgisi */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {isCustomPickle && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                                  🏺
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-xs">
                                {label}
                              </span>
                            </div>
                            {isCustomPickle && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                                  {weightG ? `${weightKg} kg (${weightG} gr)` : "1 kg (Varsayılan)"}
                                </span>
                                <span>· Malzeme katsayısı: {weightKg}x</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-3 py-3.5">
                          <Input
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(index, { sku: e.target.value })
                            }
                            placeholder="SKU"
                            className="h-8.5 font-mono text-xs uppercase"
                            aria-invalid={Boolean(
                              fieldErrors[`variants.${index}.sku`],
                            )}
                          />
                          {fieldErrors[`variants.${index}.sku`] && (
                            <span className="text-[11px] font-medium text-red-600">
                              {fieldErrors[`variants.${index}.sku`]}
                            </span>
                          )}
                        </td>

                        {/* Satış Fiyatı */}
                        <td className="px-3 py-3.5">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              ₺
                            </span>
                            <Input
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(index, { price: e.target.value })
                              }
                              inputMode="decimal"
                              placeholder="0.00"
                              className="h-8.5 pl-6 font-semibold text-xs text-slate-900"
                            />
                          </div>
                          {fieldErrors[`variants.${index}.price`] && (
                            <span className="text-[11px] font-medium text-red-600">
                              {fieldErrors[`variants.${index}.price`]}
                            </span>
                          )}
                        </td>

                        {/* Eski Fiyat */}
                        <td className="px-3 py-3.5">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              ₺
                            </span>
                            <Input
                              value={variant.compareAtPrice}
                              onChange={(e) =>
                                updateVariant(index, {
                                  compareAtPrice: e.target.value,
                                })
                              }
                              inputMode="decimal"
                              placeholder="0.00"
                              className="h-8.5 pl-6 text-xs text-slate-500"
                            />
                          </div>
                        </td>

                        {/* Stok */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            <Input
                              value={variant.stockQuantity}
                              onChange={(e) =>
                                updateVariant(index, {
                                  stockQuantity: e.target.value,
                                })
                              }
                              inputMode="numeric"
                              className="h-8.5 text-xs font-medium"
                            />
                            <div className="flex items-center gap-1 text-[10px]">
                              {stockNum > 10 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Stokta ({stockNum})
                                </span>
                              ) : stockNum > 0 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Kritik ({stockNum})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                  Tükendi
                                </span>
                              )}
                            </div>
                          </div>
                          {fieldErrors[`variants.${index}.stockQuantity`] && (
                            <span className="text-[11px] font-medium text-red-600">
                              {fieldErrors[`variants.${index}.stockQuantity`]}
                            </span>
                          )}
                        </td>

                        {/* Durum (Aktif/Pasif Toggle) */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateVariant(index, {
                                isActive: !variant.isActive,
                              })
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                              variant.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                variant.isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span>{variant.isActive ? "Yayında" : "Pasif"}</span>
                          </button>
                        </td>

                        {/* Kaldır Butonu */}
                        {isCustomPickle && (
                          <td className="px-3 py-3.5 text-center">
                            <button
                              type="button"
                              title="Bu boyutu seçeneklerden çıkar"
                              onClick={() => handleRemoveSize(label)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <span className="text-3xl mb-2">🏺</span>
              <p className="text-sm font-bold text-slate-800">
                Henüz hiçbir varyant oluşturulmadı
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Yukarıdaki seçeneklerden boyutları girip &quot;Varyantları Güncelle&quot; butonuna basarak liste oluşturabilirsiniz.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={generateVariants}
                className="mt-4 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
              >
                Varyantları Şimdi Oluştur
              </Button>
            </div>
          )}

          {fieldErrors["variants"] && (
            <div className="p-4 border-t border-red-200 bg-red-50">
              <span role="alert" className="text-xs font-semibold text-red-600">
                {fieldErrors["variants"]}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sipariş & Hesaplama Bilgi Kartı */}
      {isCustomPickle && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span>💡</span>
              <span>Sepet Fiyatı Nasıl Hesaplanır?</span>
            </h4>
            <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
              <p>
                <strong>Toplam Fiyat =</strong> Taban Bidon Fiyatı + Malzemeler Ek Ücreti + Salamura / Acılık Ek Ücreti
              </p>
              <p className="text-[11px] text-slate-500">
                Müşteri 5 kg bidon seçtiğinde malzeme kg fiyatı 5 ile çarpılır; 10 kg seçtiğinde 10 ile çarpılır.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span>🌿</span>
              <span>Malzeme ve Tarif Yönetimi</span>
            </h4>
            <p className="mt-2.5 text-xs text-slate-600">
              Sebze, baharat, salamura suları ve acılık seviyelerini düzenlemek için sol menüdeki <strong>&quot;Kendi Turşunu Yap&quot;</strong> sayfasına gidebilirsiniz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
