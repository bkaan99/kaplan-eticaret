"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { discountPercent } from "@/shared/money";
import type { ProductFormState } from "./use-product-form";
import {
  axisOf,
  QUICK_SIZES,
  type RowIssues,
  type VariantRow,
} from "./variant-rows";

interface ProductVariantsListProps {
  form: Pick<
    ProductFormState,
    | "options"
    | "variants"
    | "updateVariant"
    | "variantEditor"
    | "variantIssues"
    | "fieldErrors"
    | "trackInventory"
  >;
}

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-[11px] font-medium text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

/** Fiyat, eski fiyat, stok ve SKU alanları: her varyantın kendi değerleri. */
function PriceFields({
  row,
  index,
  issues,
  serverErrors,
  trackInventory,
  onChange,
}: {
  row: VariantRow;
  index: number;
  issues: RowIssues | undefined;
  serverErrors: Record<string, string>;
  trackInventory: boolean;
  onChange: (patch: Partial<VariantRow>) => void;
}) {
  const discount = discountPercent(
    row.price.replace(",", "."),
    row.compareAtPrice.trim() ? row.compareAtPrice.replace(",", ".") : null,
  );
  const invalid = (message?: string) =>
    message ? "border-red-400 focus-visible:ring-red-200" : "";

  const priceError =
    issues?.price ?? serverErrors[`variants.${index}.price`] ?? undefined;
  const stockError =
    issues?.stockQuantity ??
    serverErrors[`variants.${index}.stockQuantity`] ??
    undefined;
  const skuError = serverErrors[`variants.${index}.sku`];

  return (
    <>
      <Labeled label="Fiyat (₺)" error={priceError}>
        <Input
          value={row.price}
          inputMode="decimal"
          placeholder="249,90"
          className={`h-10 text-sm font-semibold ${invalid(priceError)}`}
          onChange={(event) => onChange({ price: event.target.value })}
        />
      </Labeled>
      <Labeled
        label="Eski fiyat (₺)"
        hint={
          discount ? undefined : "İndirim göstermek için; yoksa boş bırakın"
        }
        error={issues?.compareAtPrice}
      >
        <div className="flex items-center gap-2">
          <Input
            value={row.compareAtPrice}
            inputMode="decimal"
            placeholder="299,90"
            className={`h-10 text-sm ${invalid(issues?.compareAtPrice)}`}
            onChange={(event) =>
              onChange({ compareAtPrice: event.target.value })
            }
          />
          {discount ? (
            <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
              %{discount} indirim
            </span>
          ) : null}
        </div>
      </Labeled>
      <Labeled
        label="Stok"
        hint={trackInventory ? undefined : "Stok takibi kapalı"}
        error={stockError}
      >
        <Input
          value={row.stockQuantity}
          inputMode="numeric"
          className={`h-10 text-sm ${invalid(stockError)}`}
          onChange={(event) => onChange({ stockQuantity: event.target.value })}
        />
      </Labeled>
      <Labeled label="SKU" error={skuError}>
        <Input
          value={row.sku}
          className={`h-10 font-mono text-xs ${invalid(skuError)}`}
          onChange={(event) => onChange({ sku: event.target.value })}
        />
      </Labeled>
    </>
  );
}

export function ProductVariantsList({ form }: ProductVariantsListProps) {
  const { options, variants, updateVariant, variantEditor, variantIssues } =
    form;
  const axis = axisOf(options);
  const serverErrors = form.fieldErrors;

  /* ------------------------------------------------------------------ */
  /* Tek fiyatlı ürün: seçenek yok                                       */
  /* ------------------------------------------------------------------ */
  if (!axis) {
    const row = variants[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Fiyat ve stok</CardTitle>
          <p className="text-xs text-slate-500">
            Ürünün tek bir fiyatı var. 3 kg, 5 kg gibi boyutları ayrı ayrı
            fiyatlamak için aşağıdaki düğmeyi kullanın.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {row ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PriceFields
                row={row}
                index={0}
                issues={variantIssues[0]}
                serverErrors={serverErrors}
                trackInventory={form.trackInventory}
                onChange={(patch) => updateVariant(0, patch)}
              />
            </div>
          ) : null}
          <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Birden fazla boyut mu var?
            </p>
            <p className="text-xs text-slate-500">
              Örneğin 3 kg ve 5 kg. Her biri için ayrı fiyat, eski fiyat ve stok
              girebilirsiniz.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={variantEditor.enableAxis}
              className="mt-1"
            >
              + Boyut / varyant ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Varyant listesi                                                     */
  /* ------------------------------------------------------------------ */
  const existingValues = new Set(
    variants.map((row) => (row.optionValues[axis] ?? "").trim().toLowerCase()),
  );

  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle className="text-base font-bold">Varyantlar</CardTitle>
          <p className="mt-0.5 text-xs text-slate-500">
            Her satır bir varyanttır ve kendi fiyatı vardır. Kaydedince müşteri
            ürün sayfasında boyutu seçer, fiyat seçime göre değişir.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex w-44 flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-600">
              Seçenek adı
            </span>
            <Input
              value={axis}
              className="h-9 text-sm font-medium"
              onChange={(event) => variantEditor.renameAxis(event.target.value)}
              placeholder="Boyut"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Hızlı ekle:
            </span>
            {QUICK_SIZES.map((size) => {
              const exists = existingValues.has(size.toLowerCase());
              return (
                <button
                  key={size}
                  type="button"
                  disabled={exists}
                  onClick={() => variantEditor.addRow(size)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
                >
                  {exists ? "✓ " : "+ "}
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {variants.map((row, index) => {
          const issues = variantIssues[index];
          const value = row.optionValues[axis] ?? "";
          const valueError =
            issues?.value ??
            serverErrors[`variants.${index}.optionValues.${axis}`] ??
            serverErrors[`variants.${index}`];
          const saved = Boolean(row.id);

          return (
            <div
              key={row.id ?? `new-${index}`}
              className={`flex flex-col gap-3 rounded-xl border p-4 ${
                row.isActive
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                    Varyant {index + 1}
                  </span>
                  {!row.isActive ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Satışta değil
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {!row.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateVariant(index, { isActive: true })}
                    >
                      Yeniden satışa al
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      title={
                        saved
                          ? "Kayıtlı varyant silinmez, satıştan kaldırılır; sipariş geçmişi korunur"
                          : "Satırı sil"
                      }
                      onClick={() => variantEditor.removeRow(index)}
                      disabled={
                        variants.filter((item) => item.isActive).length <= 1
                      }
                    >
                      {saved ? "Satıştan kaldır" : "Sil"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.3fr_0.8fr_1.2fr]">
                <Labeled label={axis} error={valueError}>
                  <Input
                    value={value}
                    placeholder="3 kg"
                    className={`h-10 text-sm font-bold ${
                      valueError
                        ? "border-red-400 focus-visible:ring-red-200"
                        : ""
                    }`}
                    onChange={(event) =>
                      variantEditor.setRowValue(index, event.target.value)
                    }
                  />
                </Labeled>
                <PriceFields
                  row={row}
                  index={index}
                  issues={issues}
                  serverErrors={serverErrors}
                  trackInventory={form.trackInventory}
                  onChange={(patch) => updateVariant(index, patch)}
                />
              </div>
            </div>
          );
        })}

        {serverErrors["variants"] ? (
          <span role="alert" className="text-xs font-medium text-red-600">
            {serverErrors["variants"]}
          </span>
        ) : null}
        {serverErrors["options"] ? (
          <span role="alert" className="text-xs font-medium text-red-600">
            {serverErrors["options"]}
          </span>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => variantEditor.addRow()}
          >
            + Varyant ekle
          </Button>
          {variantEditor.canDisableAxis ? (
            <button
              type="button"
              onClick={variantEditor.disableAxis}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Tek fiyata dön
            </button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
