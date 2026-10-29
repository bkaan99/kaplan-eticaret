"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type {
  EditableProduct,
  FormReferences,
} from "@/modules/admin/catalog/product-admin.repository";
import { generateCombinations } from "@/modules/admin/catalog/product.schema";
import { saveProductAction } from "./actions";

export interface VariantRow {
  id?: string;
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  isActive: boolean;
  optionValues: Record<string, string>;
}

export interface ImageRow {
  url: string;
  alt: string;
  forOption: string; // "Renk\u0000Siyah" veya ""
}

export interface OptionRow {
  name: string;
  values: string;
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

export function useProductForm({ product, references, mode }: UseProductFormProps) {
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

  function generateVariants() {
    const combos = generateCombinations(parsedOptions);
    const existing = new Map(
      variants.map((v) => [comboKey(options, v.optionValues), v]),
    );
    const basePrice = variants[0]?.price ?? "";
    const baseSku = (slug || name || "URUN")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 24);

    setVariants(
      combos.map((combo) => {
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
      }),
    );
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
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
    attributeValueIds,
    toggleAttribute,
    options,
    setOptions,
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
