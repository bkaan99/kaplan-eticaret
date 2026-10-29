"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./product-form-field";
import type { OptionRow, VariantRow } from "./use-product-form";

interface ProductVariantsSectionProps {
  options: OptionRow[];
  setOptions: React.Dispatch<React.SetStateAction<OptionRow[]>>;
  variants: VariantRow[];
  updateVariant: (index: number, patch: Partial<VariantRow>) => void;
  generateVariants: () => void;
  fieldErrors: Record<string, string>;
}

export function ProductVariantsSection({
  options,
  setOptions,
  variants,
  updateVariant,
  generateVariants,
  fieldErrors,
}: ProductVariantsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seçenekler ve varyantlar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Her seçenek için değerleri virgülle ayırın (örn. Renk: Siyah, Beyaz).
          Ardından varyantları oluşturun. Mevcut varyantlar korunur; listede
          olmayanlar pasifleştirilir.
        </p>

        {options.map((option, index) => (
          <div
            key={index}
            className="grid items-end gap-2 sm:grid-cols-[180px_1fr_auto]"
          >
            <Field label="Seçenek adı">
              <Input
                value={option.name}
                onChange={(e) =>
                  setOptions((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, name: e.target.value } : r,
                    ),
                  )
                }
                placeholder="Renk"
              />
            </Field>
            <Field label="Değerler">
              <Input
                value={option.values}
                onChange={(e) =>
                  setOptions((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, values: e.target.value } : r,
                    ),
                  )
                }
                placeholder="Siyah, Beyaz"
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setOptions((rows) => rows.filter((_, i) => i !== index))
              }
            >
              Kaldır
            </Button>
          </div>
        ))}
        {fieldErrors["options"] ? (
          <span role="alert" className="text-xs text-red-600">
            {fieldErrors["options"]}
          </span>
        ) : null}

        <div className="flex gap-2">
          {options.length < 3 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setOptions((rows) => [...rows, { name: "", values: "" }])
              }
            >
              Seçenek ekle
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={generateVariants}>
            {options.length === 0 && variants.length === 0
              ? "Tek varyant oluştur"
              : "Varyantları oluştur"}
          </Button>
        </div>

        {variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Seçenekler</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Fiyat</th>
                  <th className="px-2 py-2">Eski fiyat</th>
                  <th className="px-2 py-2">Stok</th>
                  <th className="px-2 py-2">Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variants.map((variant, index) => (
                  <tr key={variant.id ?? `new-${index}`}>
                    <td className="px-2 py-2">
                      {Object.values(variant.optionValues).join(" / ") ||
                        "Standart"}
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, { sku: e.target.value })
                        }
                        aria-invalid={Boolean(
                          fieldErrors[`variants.${index}.sku`],
                        )}
                      />
                      {fieldErrors[`variants.${index}.sku`] ? (
                        <span className="text-xs text-red-600">
                          {fieldErrors[`variants.${index}.sku`]}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, { price: e.target.value })
                        }
                        inputMode="decimal"
                        className="w-28"
                      />
                      {fieldErrors[`variants.${index}.price`] ? (
                        <span className="text-xs text-red-600">
                          {fieldErrors[`variants.${index}.price`]}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={variant.compareAtPrice}
                        onChange={(e) =>
                          updateVariant(index, {
                            compareAtPrice: e.target.value,
                          })
                        }
                        inputMode="decimal"
                        className="w-28"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={variant.stockQuantity}
                        onChange={(e) =>
                          updateVariant(index, {
                            stockQuantity: e.target.value,
                          })
                        }
                        inputMode="numeric"
                        className="w-24"
                      />
                      {fieldErrors[`variants.${index}.stockQuantity`] ? (
                        <span className="text-xs text-red-600">
                          {fieldErrors[`variants.${index}.stockQuantity`]}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(e) =>
                          updateVariant(index, { isActive: e.target.checked })
                        }
                        aria-label="Aktif"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {fieldErrors["variants"] ? (
          <span role="alert" className="text-xs text-red-600">
            {fieldErrors["variants"]}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
