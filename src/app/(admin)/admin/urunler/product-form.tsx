"use client";

import { Button } from "@/components/ui/button";
import type {
  EditableProduct,
  FormReferences,
} from "@/modules/admin/catalog/product-admin.repository";
import { ProductAttributesSection } from "./product-attributes-section";
import { ProductBasicInfo } from "./product-basic-info";
import { ProductMediaSection } from "./product-media-section";
import { ProductSeoSection } from "./product-seo-section";
import { ProductVariantsSection } from "./product-variants-section";
import { useProductForm } from "./use-product-form";

export function ProductForm({
  product,
  references,
  mode,
}: {
  product?: EditableProduct;
  references: FormReferences;
  mode: "create" | "edit";
}) {
  const form = useProductForm({ product, references, mode });

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {form.error ? (
        <p
          role="alert"
          className="rounded-theme border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {form.error}
        </p>
      ) : null}
      {form.saved ? (
        <p
          role="status"
          className="rounded-theme border border-green-300 bg-green-50 p-3 text-sm text-green-800"
        >
          Ürün kaydedildi.
        </p>
      ) : null}

      <ProductBasicInfo
        name={form.name}
        setName={form.setName}
        slug={form.slug}
        setSlug={form.setSlug}
        status={form.status}
        setStatus={form.setStatus}
        categoryId={form.categoryId}
        setCategoryId={form.setCategoryId}
        brandId={form.brandId}
        setBrandId={form.setBrandId}
        description={form.description}
        setDescription={form.setDescription}
        taxRate={form.taxRate}
        setTaxRate={form.setTaxRate}
        trackInventory={form.trackInventory}
        setTrackInventory={form.setTrackInventory}
        isFeatured={form.isFeatured}
        setIsFeatured={form.setIsFeatured}
        desi={form.desi}
        setDesi={form.setDesi}
        weightGram={form.weightGram}
        setWeightGram={form.setWeightGram}
        fieldErrors={form.fieldErrors}
        references={form.references}
      />

      <ProductVariantsSection
        options={form.options}
        setOptions={form.setOptions}
        variants={form.variants}
        updateVariant={form.updateVariant}
        generateVariants={form.generateVariants}
        fieldErrors={form.fieldErrors}
      />

      <ProductAttributesSection
        attributes={form.references.attributes}
        attributeValueIds={form.attributeValueIds}
        toggleAttribute={form.toggleAttribute}
      />

      <ProductMediaSection
        images={form.images}
        setImages={form.setImages}
        uploadImage={form.uploadImage}
        uploadError={form.uploadError}
        imageOptionChoices={form.imageOptionChoices}
        fieldErrors={form.fieldErrors}
      />

      <ProductSeoSection
        seoTitle={form.seoTitle}
        setSeoTitle={form.setSeoTitle}
        seoDescription={form.seoDescription}
        setSeoDescription={form.setSeoDescription}
        fieldErrors={form.fieldErrors}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="lg"
          disabled={form.pending}
          onClick={form.submit}
        >
          {form.pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
