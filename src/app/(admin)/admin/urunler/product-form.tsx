"use client";

import Link from "next/link";
import { useState } from "react";
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
          icon: "🏺",
          badge: form.variants.length ? `${form.variants.length} Boyut` : undefined,
        },
        { id: "basic", label: "Genel Ürün Bilgileri", icon: "📋" },
        {
          id: "media",
          label: "Görseller",
          icon: "🖼️",
          badge: form.images.length ? `${form.images.length}` : undefined,
        },
        { id: "seo", label: "Arama Motoru (SEO)", icon: "🔍" },
        { id: "attributes", label: "Nitelikler", icon: "🏷️" },
      ]
    : [
        { id: "basic", label: "Temel Bilgiler", icon: "📋" },
        {
          id: "variants",
          label: "Varyantlar & Seçenekler",
          icon: "📦",
          badge: form.variants.length ? `${form.variants.length}` : undefined,
        },
        {
          id: "media",
          label: "Görseller",
          icon: "🖼️",
          badge: form.images.length ? `${form.images.length}` : undefined,
        },
        { id: "seo", label: "SEO & Arama", icon: "🔍" },
        { id: "attributes", label: "Nitelikler", icon: "🏷️" },
      ];

  const cancelControl = onCancel ? (
    <button
      type="button"
      onClick={onCancel}
      className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
    >
      Vazgeç
    </button>
  ) : (
    <Link
      href={isCustomPickle ? "/admin/tursu-malzemeleri" : "/admin/urunler"}
      className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
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
      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-60"
    >
      {form.pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Kaydediliyor...</span>
        </>
      ) : (
        <>
          <span>💾</span>
          <span>{mode === "create" ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}</span>
        </>
      )}
    </Button>
  );

  return (
    <div className={`flex flex-col gap-6 ${isModal ? "pb-4" : "pb-24"}`}>
      {/* Özel Kendi Turşunu Yap Hero Banner */}
      {isCustomPickle && (
        <div className="rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md text-2xl">
                🏺
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Kendi Turşunu Yap · Bidon Boyutları ve Taban Fiyatları
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Sistem Ürünü
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Müşterilerinizin turşu kurarken seçtiği bidon boyutları bu ürünün varyantlarıdır.
                  Taban satış fiyatlarını ve stoklarını buradan güncelleyebilir, yeni boyutlar ekleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/tursu-malzemeleri"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span>← Malzeme Yönetimine Dön</span>
              </Link>
              <Link
                href="/kendi-tursunu-yap"
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 text-xs font-semibold text-slate-950 shadow-xs hover:bg-amber-400 transition"
              >
                <span>Mağazada Test Et</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Durum Bildirimleri */}
      {form.error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 shadow-2xs"
        >
          <span className="text-lg">⚠️</span>
          <span>{form.error}</span>
        </div>
      )}
      {form.saved && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-2xs"
        >
          <span className="text-lg">✓</span>
          <span>Değişiklikler başarıyla kaydedildi.</span>
        </div>
      )}

      {/* Sekme Menüsü (Tab Navigation) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600"
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
            : "fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200/80 bg-white/95 px-6 py-3.5 shadow-lg backdrop-blur-md"
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
              <span className="font-semibold text-amber-900">
                🏺 {form.variants.length} Bidon Boyutu Tanımlı
              </span>
            ) : (
              <span>
                Ürün Durumu:{" "}
                <strong className="text-slate-800">{form.status}</strong>
              </span>
            )}
            {form.saved ? (
              <span className="hidden font-semibold text-emerald-700 sm:inline">
                · Son kaydedilme başarılı
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
