"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type {
  EditableProduct,
  FormReferences,
} from "@/modules/admin/catalog/product-admin.repository";
import { generateCombinations } from "@/modules/admin/catalog/product.schema";
import { saveProductAction } from "./actions";
import {
  addRow,
  baseSkuFrom,
  canDisableAxis,
  disableAxis,
  enableAxis,
  removeRow,
  renameAxis,
  setRowValue,
  validateRows,
  type OptionRow,
  type RowIssues,
  type VariantRow,
  type VariantState,
} from "./variant-rows";

export type { OptionRow, VariantRow };

export interface ImageRow {
  url: string;
  alt: string;
  forOption: string; // "Renk\u0000Siyah" veya ""
}

export const emptyProduct: EditableProduct = {
  id: "",
  name: "",
  slug: "",
  description: "",
  status: "DRAFT",
  categoryId: "",
  brandId: null,
  taxRate: "1",
  trackInventory: true,
  isFeatured: false,
  desi: null,
  weightGram: null,
  seoTitle: "",
  seoDescription: "",
  ingredients: "",
  allergens: "",
  shelfLife: "",
  attributeValueIds: [],
  options: [],
  variants: [],
  images: [],
};

export function comboKey(
  options: OptionRow[],
  values: Record<string, string>,
): string {
  return options.map((option) => values[option.name.trim()] ?? "").join("|");
}

export function parseValues(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

export interface UseProductFormProps {
  product?: EditableProduct;
  references: FormReferences;
  mode: "create" | "edit";
}

export function useProductForm({
  product,
  references,
  mode,
}: UseProductFormProps) {
  const initial = product ?? emptyProduct;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(mode === "edit" ? initial.slug : "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState(initial.status);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [brandId, setBrandId] = useState(initial.brandId ?? "");
  const [taxRate, setTaxRate] = useState(initial.taxRate);
  const [trackInventory, setTrackInventory] = useState(initial.trackInventory);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [desi, setDesi] = useState(initial.desi ?? "");
  const [weightGram, setWeightGram] = useState(
    initial.weightGram === null ? "" : String(initial.weightGram),
  );
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial.seoDescription ?? "",
  );
  const [ingredients, setIngredients] = useState(initial.ingredients ?? "");
  const [allergens, setAllergens] = useState(initial.allergens ?? "");
  const [shelfLife, setShelfLife] = useState(initial.shelfLife ?? "");
  const [attributeValueIds, setAttributeValueIds] = useState<string[]>(
    initial.attributeValueIds,
  );
  const [options, setOptions] = useState<OptionRow[]>(
    initial.options.map((o) => ({ name: o.name, values: o.values.join(", ") })),
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    initial.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode ?? "",
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? "",
      stockQuantity: String(v.stockQuantity),
      isActive: v.isActive,
      optionValues: v.optionValues,
    })),
  );
  const [images, setImages] = useState<ImageRow[]>(
    initial.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? "",
      forOption: image.forOption
        ? `${image.forOption.option}\u0000${image.forOption.value}`
        : "",
    })),
  );

  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadImage(file: File, index: number) {
    setUploadError(null);
    // Dosya kırpma dialogunda zaten optimize edilmiş gelir.
    const body = new FormData();
    body.set("file", file);

    try {
      const response = await fetch("/admin/yukle", { method: "POST", body });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        setUploadError(result.error ?? "Yükleme başarısız");
        return;
      }
      const url = result.url;
      setImages((rows) =>
        rows.map((row, i) => (i === index ? { ...row, url } : row)),
      );
    } catch {
      setUploadError("Yükleme başarısız, bağlantınızı kontrol edin");
    }
  }

  const parsedOptions = useMemo(
    () =>
      options
        .map((option) => ({
          name: option.name.trim(),
          values: parseValues(option.values),
        }))
        .filter((option) => option.name && option.values.length > 0),
    [options],
  );

  /**
   * Seçeneklerden varyant satırlarını (fiyat alanları dahil) üretir/günceller.
   * Var olan satırlar (kimlik, fiyat, stok) korunur; yalnızca yeni kombinasyonlar eklenir.
   * Seçenek alanlarından çıkılınca (blur) ve "Listeyi Yenile" ile çalışır; her tuş
   * vuruşunda çalışmaz, çünkü yazarken ara değerler satırları silip fiyatı kaybettirirdi.
   */
  function generateVariants() {
    const combos = generateCombinations(parsedOptions);
    const baseSku = (slug || name || "URUN")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 24);

    setVariants((current) => {
      const existing = new Map(
        current.map((v) => [comboKey(options, v.optionValues), v]),
      );
      const basePrice = current[0]?.price ?? "";

      return combos.map((combo) => {
        const found = existing.get(comboKey(options, combo));
        if (found) return { ...found, optionValues: combo };

        const suffix = Object.values(combo)
          .map((value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, ""))
          .join("-");
        return {
          sku: suffix ? `${baseSku}-${suffix}` : baseSku,
          barcode: "",
          price: basePrice,
          compareAtPrice: "",
          stockQuantity: "0",
          isActive: true,
          optionValues: combo,
        };
      });
    });
  }

  /** Sade varyant düzenleyicisi: özel bidon ürünü ve çok eksenli ürünler eski düzenleyiciyi kullanır. */
  const simpleVariants =
    options.length <= 1 && product?.slug !== "kendi-tursunu-yap";
  const [variantIssues, setVariantIssues] = useState<Record<number, RowIssues>>(
    {},
  );
  const baseSku = baseSkuFrom(slug, name);

  function applyVariantState(change: (state: VariantState) => VariantState) {
    const next = change({ options, variants });
    setOptions(next.options);
    setVariants(next.variants);
    setVariantIssues({});
  }

  const variantEditor = {
    addRow: (value?: string) =>
      applyVariantState((state) => addRow(state, baseSku, value)),
    setRowValue: (index: number, value: string) =>
      applyVariantState((state) => setRowValue(state, baseSku, index, value)),
    renameAxis: (newName: string) =>
      applyVariantState((state) => renameAxis(state, newName)),
    removeRow: (index: number) =>
      applyVariantState((state) => removeRow(state, index)),
    enableAxis: () => applyVariantState((state) => enableAxis(state, baseSku)),
    disableAxis: () => applyVariantState((state) => disableAxis(state)),
    canDisableAxis: canDisableAxis({ options, variants }),
  };

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    // Düzenlenen alanın eski hata işareti kalkar (yeniden kaydedince tekrar denetlenir).
    setVariantIssues((current) => {
      const issues = current[index];
      if (!issues) return current;
      const next = { ...issues };
      if ("price" in patch) delete next.price;
      if ("compareAtPrice" in patch) delete next.compareAtPrice;
      if ("stockQuantity" in patch) delete next.stockQuantity;
      const rest = { ...current };
      delete rest[index];
      return Object.keys(next).length > 0 ? { ...rest, [index]: next } : rest;
    });
  }

  function toggleAttribute(valueId: string) {
    setAttributeValueIds((ids) =>
      ids.includes(valueId)
        ? ids.filter((id) => id !== valueId)
        : [...ids, valueId],
    );
  }

  function submit() {
    setError(null);
    setSaved(false);

    if (simpleVariants) {
      const issues = validateRows({ options, variants });
      setVariantIssues(issues);
      if (Object.keys(issues).length > 0) {
        setError(
          "Varyantlarda eksik veya hatalı alan var. Kırmızı işaretli alanları düzeltin.",
        );
        return;
      }
    }

    const payload = {
      name,
      slug,
      description,
      status,
      categoryId,
      brandId,
      taxRate,
      trackInventory,
      isFeatured,
      desi,
      weightGram,
      seoTitle,
      seoDescription,
      ingredients,
      allergens,
      shelfLife,
      attributeValueIds,
      options: parsedOptions,
      variants: variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
        optionValues: variant.optionValues,
      })),
      images: images
        .filter((image) => image.url.trim())
        .map((image) => {
          const [option, value] = image.forOption.split("\u0000");
          return {
            url: image.url,
            alt: image.alt,
            forOption:
              image.forOption && option && value ? { option, value } : null,
          };
        }),
    };

    startTransition(async () => {
      const result = await saveProductAction(
        mode === "edit" ? initial.id : null,
        payload,
      );
      if (!result.ok) {
        setError(result.error ?? "Kaydedilemedi");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setFieldErrors({});
      if (mode === "create" && result.id) {
        router.push(`/admin/urunler/${result.id}`);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const imageOptionChoices = parsedOptions.flatMap((option) =>
    option.values.map((value) => ({
      key: `${option.name}\u0000${value}`,
      label: `${option.name}: ${value}`,
    })),
  );

  return {
    references,
    pending,
    error,
    fieldErrors,
    saved,
    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    status,
    setStatus,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
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
    seoTitle,
    setSeoTitle,
    seoDescription,
    setSeoDescription,
    ingredients,
    setIngredients,
    allergens,
    setAllergens,
    shelfLife,
    setShelfLife,
    attributeValueIds,
    toggleAttribute,
    options,
    setOptions,
    simpleVariants,
    variantEditor,
    variantIssues,
    variants,
    updateVariant,
    generateVariants,
    images,
    setImages,
    uploadImage,
    uploadError,
    imageOptionChoices,
    submit,
  };
}

export type ProductFormState = ReturnType<typeof useProductForm>;
