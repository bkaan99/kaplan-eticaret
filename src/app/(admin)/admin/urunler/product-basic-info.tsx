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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Temel Ürün Bilgileri
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Ürün adı, kategorisi, açıklaması ve genel mağaza ayarları
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 sm:grid-cols-2 pt-2">
        {/* Ürün Adı */}
        <div className="sm:col-span-2">
          <Field label="Ürün Adı" required error={fieldErrors["name"]}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Kaplan Gurme Çubuk Turşusu"
              className="h-10 text-sm font-semibold"
            />
          </Field>
        </div>

        {/* Adres (slug) */}
        <Field
          label="Adres (URL Slug)"
          hint="Boş bırakılırsa addan otomatik üretilir"
          error={fieldErrors["slug"]}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
              /urun/
            </span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="cubuk-tursusu"
              className="h-9.5 pl-15 font-mono text-xs text-slate-800"
            />
          </div>
        </Field>

        {/* Durum */}
        <Field label="Yayın Durumu" error={fieldErrors["status"]}>
          <div className="relative">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9.5 text-xs font-semibold"
            >
              <option value="ACTIVE">● Yayında (Satışta)</option>
              <option value="DRAFT">○ Taslak (Gizli)</option>
              <option value="ARCHIVED">✕ Arşivlendi</option>
            </Select>
          </div>
        </Field>

        {/* Kategori */}
        <Field label="Kategori" required error={fieldErrors["categoryId"]}>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-9.5 text-xs"
          >
            <option value="">Kategori seçin</option>
            {references.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>

        {/* Marka */}
        <Field label="Marka / Üretici">
          <Select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-9.5 text-xs"
          >
            <option value="">Marka seçilmedi</option>
            {references.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </Field>

        {/* Açıklama */}
        <div className="sm:col-span-2">
          <Field
            label="Ürün Açıklaması"
            hint="Ürün sayfasında müşterilere gösterilecek detaylı bilgi"
            error={fieldErrors["description"]}
          >
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ürünün yapılışı, saklama koşulları, içeriği ve lezzeti hakkında bilgi..."
              className="text-xs leading-relaxed"
            />
          </Field>
        </div>

        {/* KDV Oranı */}
        <Field
          label="KDV Oranı (%)"
          hint="Turşu & sirke: %1, Şalgam/İçecek: %10"
          error={fieldErrors["taxRate"]}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              %
            </span>
            <Input
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              inputMode="decimal"
              placeholder="1"
              className="h-9.5 pl-7 text-xs font-semibold"
            />
          </div>
        </Field>

        {/* Lojistik (Desi & Ağırlık) */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desi" hint="Kargo hacmi" error={fieldErrors["desi"]}>
            <Input
              value={desi}
              onChange={(e) => setDesi(e.target.value)}
              inputMode="decimal"
              placeholder="Örn: 2"
              className="h-9.5 text-xs font-mono"
            />
          </Field>
          <Field
            label="Ağırlık (Gram)"
            hint="Toplam ağırlık"
            error={fieldErrors["weightGram"]}
          >
            <Input
              value={weightGram}
              onChange={(e) => setWeightGram(e.target.value)}
              inputMode="numeric"
              placeholder="Örn: 1000"
              className="h-9.5 text-xs font-mono"
            />
          </Field>
        </div>

        {/* Seçenek Kutuları */}
        <div className="sm:col-span-2 flex flex-wrap gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(e) => setTrackInventory(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Stok takibi yapılsın (Stok tükenince satış durdurulur)</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Vitrin / Ana sayfada öne çıkarılsın</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
