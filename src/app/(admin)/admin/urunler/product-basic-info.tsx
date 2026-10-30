"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormReferences } from "@/modules/admin/catalog/product-admin.repository";
import { Field } from "./product-form-field";

interface ProductBasicInfoProps {
  name: string;
  setName: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  setStatus: (v: "DRAFT" | "ACTIVE" | "ARCHIVED") => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  brandId: string;
  setBrandId: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  taxRate: string;
  setTaxRate: (v: string) => void;
  trackInventory: boolean;
  setTrackInventory: (v: boolean) => void;
  isFeatured: boolean;
  setIsFeatured: (v: boolean) => void;
  desi: string;
  setDesi: (v: string) => void;
  weightGram: string;
  setWeightGram: (v: string) => void;
  fieldErrors: Record<string, string>;
  references: FormReferences;
}

export function ProductBasicInfo({
  name,
  setName,
  slug,
  setSlug,
  status,
  setStatus,
  categoryId,
  setCategoryId,
  brandId,
  setBrandId,
  description,
  setDescription,
  taxRate,
  setTaxRate,
  trackInventory,
  setTrackInventory,
  isFeatured,
  setIsFeatured,
  desi,
  setDesi,
  weightGram,
  setWeightGram,
  fieldErrors,
  references,
}: ProductBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temel bilgiler</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Ürün adı" error={fieldErrors["name"]}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label="Adres (slug)" error={fieldErrors["slug"]}>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Boş bırakılırsa addan üretilir"
          />
        </Field>
        <Field label="Durum" error={fieldErrors["status"]}>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="DRAFT">Taslak</option>
            <option value="ACTIVE">Yayında</option>
            <option value="ARCHIVED">Arşiv</option>
          </Select>
        </Field>
        <Field label="Kategori" error={fieldErrors["categoryId"]}>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Seçin</option>
            {references.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Marka">
          <Select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Marka yok</option>
            {references.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Açıklama" error={fieldErrors["description"]}>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <Field label="KDV oranı (%)" error={fieldErrors["taxRate"]}>
          <Input
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            inputMode="decimal"
            placeholder="1"
          />
          <span className="text-xs text-muted-foreground">
            Temel gıda (turşu, sirke) için %1, şalgam/içecek için %10, genel ürünlerde %20.
          </span>
        </Field>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(e) => setTrackInventory(e.target.checked)}
            />
            Stok takibi yap
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Ana sayfada öne çıkar
          </label>
        </div>
        <Field label="Desi" error={fieldErrors["desi"]}>
          <Input
            value={desi}
            onChange={(e) => setDesi(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Ağırlık (gram)" error={fieldErrors["weightGram"]}>
          <Input
            value={weightGram}
            onChange={(e) => setWeightGram(e.target.value)}
            inputMode="numeric"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
