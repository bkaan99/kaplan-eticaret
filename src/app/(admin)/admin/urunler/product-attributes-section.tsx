"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormReferences } from "@/modules/admin/catalog/product-admin.repository";

interface ProductAttributesSectionProps {
  attributes: FormReferences["attributes"];
  attributeValueIds: string[];
  toggleAttribute: (valueId: string) => void;
}

export function ProductAttributesSection({
  attributes,
  attributeValueIds,
  toggleAttribute,
}: ProductAttributesSectionProps) {
  if (attributes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900">
          Nitelikler ve Filtreler
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Müşterilerin mağazada filtreleme yaparken kullanacağı ürün özellikleri
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-1">
        {attributes.map((attribute) => (
          <fieldset key={attribute.id} className="flex flex-col gap-2.5">
            <legend className="text-xs font-bold text-slate-700">
              {attribute.name}
            </legend>
            <div className="flex flex-wrap gap-2 text-xs">
              {attribute.values.map((value) => {
                const isSelected = attributeValueIds.includes(value.id);
                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => toggleAttribute(value.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold transition cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{value.value}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </CardContent>
    </Card>
  );
}
