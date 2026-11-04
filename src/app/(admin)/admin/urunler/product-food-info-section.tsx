"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./product-form-field";

interface ProductFoodInfoSectionProps {
  ingredients: string;
  setIngredients: (v: string) => void;
  allergens: string;
  setAllergens: (v: string) => void;
  shelfLife: string;
  setShelfLife: (v: string) => void;
  fieldErrors: Record<string, string>;
}

/** Gıda etiketi bilgileri: ürün sayfasında "İçindekiler ve alerjen" bölümünde gösterilir. */
export function ProductFoodInfoSection({
  ingredients,
  setIngredients,
  allergens,
  setAllergens,
  shelfLife,
  setShelfLife,
  fieldErrors,
}: ProductFoodInfoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900">
          Gıda Bilgileri
        </CardTitle>
        <p className="mt-0.5 text-xs text-slate-500">
          İçindekiler, alerjen uyarısı ve raf ömrü ürün sayfasında müşteriye
          gösterilir. Boş bırakılan alan görünmez.
        </p>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field
          label="İçindekiler"
          hint={`${ingredients.length} / 1000 karakter`}
          error={fieldErrors["ingredients"]}
        >
          <Textarea
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            maxLength={1000}
            placeholder="Örn: Salatalık, su, kaya tuzu, sarımsak, dereotu, nohut"
            className="text-xs leading-relaxed"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Alerjen Uyarısı" error={fieldErrors["allergens"]}>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              maxLength={300}
              placeholder="Örn: Hardal içerir / Alerjen içermez"
              className="h-9.5 text-xs font-medium"
            />
          </Field>
          <Field label="Raf Ömrü" error={fieldErrors["shelfLife"]}>
            <Input
              value={shelfLife}
              onChange={(e) => setShelfLife(e.target.value)}
              maxLength={200}
              placeholder="Örn: Açılmadan 12 ay, açıldıktan sonra buzdolabında 2 ay"
              className="h-9.5 text-xs font-medium"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
