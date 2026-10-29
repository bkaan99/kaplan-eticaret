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
      <CardHeader>
        <CardTitle>Nitelikler (filtrelerde kullanılır)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {attributes.map((attribute) => (
          <fieldset key={attribute.id} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {attribute.name}
            </legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {attribute.values.map((value) => (
                <label key={value.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attributeValueIds.includes(value.id)}
                    onChange={() => toggleAttribute(value.id)}
                  />
                  {value.value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </CardContent>
    </Card>
  );
}
