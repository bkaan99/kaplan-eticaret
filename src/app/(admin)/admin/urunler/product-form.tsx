"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  EditableProduct,
  FormReferences,
} from "@/modules/admin/catalog/product-admin.repository";
import { ProductAttributesSection } from "./product-attributes-section";
import { ProductBasicInfo } from "./product-basic-info";
import { ProductFoodInfoSection } from "./product-food-info-section";
import { ProductMediaSection } from "./product-media-section";
import { ProductSeoSection } from "./product-seo-section";
import { ProductVariantsSection } from "./product-variants-section";
import { useProductForm } from "./use-product-form";

const STATUS_LABELS = {
  DRAFT: "Taslak",
  ACTIVE: "Yayında",
  ARCHIVED: "Arşiv",
} as const;

const ICON_PATHS: Record<string, string[]> = {
  info: ["M12 16v-4", "M12 8h.01", "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"],
  layers: ["m12 2 9 5-9 5-9-5 9-5Z", "m3 12 9 5 9-5", "m3 17 9 5 9-5"],
  jar: ["M8 3h8v3H8z", "M7 6h10l1 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l1-3Z"],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "m21 15-5-5L5 21",
    "M9 9h.01",
  ],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-3.5-3.5"],
  tag: [
    "M12.6 2.6 21.4 11.4a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z",
    "M7.5 7.5h.01",
  ],
};

function TabIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={15}
      height={15}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(ICON_PATHS[name] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function ProductForm({
  product,
  references,
  mode,
  initialTab,
  layout = "page",
  onCancel,
}: {
  product?: EditableProduct;
  references: FormReferences;
  mode: "create" | "edit";
  initialTab?: string;
  layout?: "page" | "modal";
  onCancel?: () => void;
}) {
  const isCustomPickle = product?.slug === "kendi-tursunu-yap";
  const defaultTab = initialTab || (isCustomPickle ? "variants" : "basic");
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const isModal = layout === "modal";

  const form = useProductForm({ product, references, mode });

  const tabs = isCustomPickle
    ? [
        {
          id: "variants",
          label: "Bidon Boyutları & Fiyatlar",
          icon: "jar",
          badge: form.variants.length
            ? `${form.variants.length} Boyut`
            : undefined,
        },
        { id: "basic", label: "Genel Ürün Bilgileri", icon: "info" },
        {
          id: "media",
          label: "Görseller",
          icon: "image",
          badge: form.images.length ? `${form.images.length}` : undefined,
        },
        { id: "seo", label: "Arama Motoru (SEO)", icon: "search" },
        { id: "attributes", label: "Nitelikler", icon: "tag" },
      ]
    : [
        { id: "basic", label: "Temel Bilgiler", icon: "info" },
        {
          id: "variants",
          label: "Varyantlar & Seçenekler",
          icon: "layers",
          badge: form.variants.length ? `${form.variants.length}` : undefined,
        },
        {
          id: "media",
          label: "Görseller",
          icon: "image",
          badge: form.images.length ? `${form.images.length}` : undefined,
        },
        { id: "seo", label: "SEO & Arama", icon: "search" },
        { id: "attributes", label: "Nitelikler", icon: "tag" },
      ];

  const cancelControl = onCancel ? (
    <button
      type="button"
      onClick={onCancel}
      className={buttonVariants({ variant: "ghost" })}
    >
      Vazgeç
    </button>
  ) : (
    <Link
      href={isCustomPickle ? "/admin/tursu-malzemeleri" : "/admin/urunler"}
      className={buttonVariants({ variant: "ghost" })}
    >
      Vazgeç
    </Link>
  );

  const saveButton = (
    <Button
      type="button"
      size="default"
      disabled={form.pending}
      onClick={form.submit}
      className="min-w-36 cursor-pointer px-5"
    >
      {form.pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Kaydediliyor...</span>
        </>
      ) : (
        <span>
          {mode === "create" ? "Ürünü oluştur" : "Değişiklikleri kaydet"}
        </span>
      )}
    </Button>
  );

  return (
    <div className={`flex flex-col gap-6 ${isModal ? "pb-4" : "pb-24"}`}>
      {/* Özel Kendi Turşunu Yap Hero Banner */}
      {isCustomPickle && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <TabIcon name="jar" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-slate-900">
                    Kendi Turşunu Yap · Bidon Boyutları ve Taban Fiyatları
                  </h2>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    Sistem Ürünü
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Müşterilerinizin turşu kurarken seçtiği bidon boyutları bu
                  ürünün varyantlarıdır. Taban satış fiyatlarını ve stoklarını
                  buradan güncelleyebilir, yeni boyutlar ekleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/tursu-malzemeleri"
                className={buttonVariants({ variant: "outline" })}
              >
                <span>Malzemeler</span>
              </Link>
              <Link
                href="/kendi-tursunu-yap"
                target="_blank"
                className={buttonVariants({ variant: "outline" })}
              >
                <span>Mağazada test et ↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Durum Bildirimleri */}
      {form.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-800"
        >
          <span>{form.error}</span>
        </div>
      )}
      {form.saved && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800"
        >
          <span>Değişiklikler kaydedildi.</span>
        </div>
      )}

      {/* Sekme Menüsü (Tab Navigation) */}
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none]"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 pt-2 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={isActive ? "text-slate-700" : "text-slate-400"}>
                <TabIcon name={tab.icon} />
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sekme İçerikleri */}
      <div className="mt-1">
        {activeTab === "variants" && (
          <ProductVariantsSection
            options={form.options}
            setOptions={form.setOptions}
            variants={form.variants}
            updateVariant={form.updateVariant}
            generateVariants={form.generateVariants}
            fieldErrors={form.fieldErrors}
            isCustomPickle={isCustomPickle}
          />
        )}

        {activeTab === "basic" && (
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
        )}

        {activeTab === "basic" && (
          <ProductFoodInfoSection
            ingredients={form.ingredients}
            setIngredients={form.setIngredients}
            allergens={form.allergens}
            setAllergens={form.setAllergens}
            shelfLife={form.shelfLife}
            setShelfLife={form.setShelfLife}
            fieldErrors={form.fieldErrors}
          />
        )}

        {activeTab === "media" && (
          <ProductMediaSection
            images={form.images}
            setImages={form.setImages}
            uploadImage={form.uploadImage}
            uploadError={form.uploadError}
            imageOptionChoices={form.imageOptionChoices}
            fieldErrors={form.fieldErrors}
          />
        )}

        {activeTab === "seo" && (
          <ProductSeoSection
            seoTitle={form.seoTitle}
            setSeoTitle={form.setSeoTitle}
            seoDescription={form.seoDescription}
            setSeoDescription={form.setSeoDescription}
            fieldErrors={form.fieldErrors}
          />
        )}

        {activeTab === "attributes" && (
          <ProductAttributesSection
            attributes={form.references.attributes}
            attributeValueIds={form.attributeValueIds}
            toggleAttribute={form.toggleAttribute}
          />
        )}
      </div>

      {/* Kaydetme çubuğu: sayfada sabit, modalda içerik altı */}
      <div
        className={
          isModal
            ? "sticky bottom-0 -mx-5 mt-2 border-t border-slate-200/80 bg-white/95 px-5 py-3.5 backdrop-blur-md"
            : "fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_-6px_rgb(15_23_42/0.12)] backdrop-blur-md sm:px-6 md:left-60"
        }
      >
        <div
          className={
            isModal
              ? "flex items-center justify-between gap-4"
              : "mx-auto flex max-w-7xl items-center justify-between gap-4"
          }
        >
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {isCustomPickle ? (
              <span className="font-medium text-slate-700">
                {form.variants.length} bidon boyutu tanımlı
              </span>
            ) : (
              <span>
                Durum:{" "}
                <strong className="font-semibold text-slate-800">
                  {STATUS_LABELS[form.status]}
                </strong>
              </span>
            )}
            {form.saved ? (
              <span className="hidden font-semibold text-emerald-700 sm:inline">
                · Kaydedildi
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {cancelControl}
            {saveButton}
          </div>
        </div>
      </div>
    </div>
  );
}
