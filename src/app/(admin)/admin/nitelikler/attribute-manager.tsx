"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/cn";
import { deleteBrandAction } from "./actions";
import { AttributeCard } from "./attribute-card";
import { AttributeModal } from "./attribute-modal";
import { type AttributeView, type BrandView } from "./attribute-types";
import { BrandModal } from "./brand-modal";
import { AttributeValueModal } from "./value-modal";

export type { AttributeView, BrandView } from "./attribute-types";

type TabId = "all" | "attributes" | "brands";

function brandInitial(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
}

export function AttributeManager({
  attributes,
  brands,
}: {
  attributes: AttributeView[];
  brands: BrandView[];
}) {
  const brandRunner = useActionRunner();

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<{
    id: string | null;
    name: string;
    isFilterable: boolean;
  } | null>(null);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandView | null>(null);

  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [selectedAttributeForValue, setSelectedAttributeForValue] =
    useState<AttributeView | null>(null);
  const [editingValue, setEditingValue] = useState<{
    id: string;
    value: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const stats = useMemo(() => {
    const totalAttr = attributes.length;
    const totalValues = attributes.reduce((acc, a) => acc + a.values.length, 0);
    const filterableCount = attributes.filter((a) => a.isFilterable).length;
    const totalBrands = brands.length;
    return { totalAttr, totalValues, filterableCount, totalBrands };
  }, [attributes, brands]);

  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) return attributes;
    const q = searchQuery.toLowerCase().trim();
    return attributes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.values.some((v) => v.value.toLowerCase().includes(q)),
    );
  }, [attributes, searchQuery]);

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase().trim();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  function handleCreateAttribute() {
    setEditingAttribute(null);
    setIsAttributeModalOpen(true);
  }

  function handleEditAttribute(attr: AttributeView) {
    setEditingAttribute({
      id: attr.id,
      name: attr.name,
      isFilterable: attr.isFilterable,
    });
    setIsAttributeModalOpen(true);
  }

  function handleOpenValueModal(attr: AttributeView) {
    setSelectedAttributeForValue(attr);
    setEditingValue(null);
    setIsValueModalOpen(true);
  }

  function handleEditValue(
    attr: AttributeView,
    value: { id: string; value: string },
  ) {
    setSelectedAttributeForValue(attr);
    setEditingValue(value);
    setIsValueModalOpen(true);
  }

  function handleCreateBrand() {
    setEditingBrand(null);
    setIsBrandModalOpen(true);
  }

  function handleEditBrand(brand: BrandView) {
    setEditingBrand(brand);
    setIsBrandModalOpen(true);
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "all", label: "Tümü" },
    { id: "attributes", label: "Nitelikler", count: attributes.length },
    { id: "brands", label: "Markalar", count: brands.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AttributeModal
        isOpen={isAttributeModalOpen}
        onClose={() => setIsAttributeModalOpen(false)}
        editingAttribute={editingAttribute}
      />

      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          setEditingBrand(null);
        }}
        editingBrand={editingBrand}
      />

      <AttributeValueModal
        isOpen={isValueModalOpen}
        onClose={() => {
          setIsValueModalOpen(false);
          setEditingValue(null);
        }}
        attribute={selectedAttributeForValue}
        editingValue={editingValue}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Nitelik", value: stats.totalAttr },
          { label: "Değer", value: stats.totalValues, hint: "Seçenekler" },
          {
            label: "Vitrin filtresi",
            value: stats.filterableCount,
            hint: "Mağazada görünür",
          },
          { label: "Marka", value: stats.totalBrands },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs"
          >
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "min-h-10 rounded-lg px-3 py-2 text-[12px] font-semibold transition sm:min-h-0 sm:py-1.5",
                    active
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                  {typeof tab.count === "number" ? (
                    <span className="ml-1 text-slate-400">{tab.count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nitelik, değer veya marka ara…"
              className="bg-white pr-8"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
                aria-label="Aramayı temizle"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "all" || activeTab === "attributes" ? (
            <Button type="button" onClick={handleCreateAttribute}>
              Yeni nitelik
            </Button>
          ) : null}
          {activeTab === "all" || activeTab === "brands" ? (
            <Button
              type="button"
              variant={activeTab === "brands" ? "default" : "outline"}
              onClick={handleCreateBrand}
            >
              Yeni marka
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid items-start gap-5",
          activeTab === "all" ? "lg:grid-cols-[1.35fr_1fr]" : "grid-cols-1",
        )}
      >
        {activeTab === "all" || activeTab === "attributes" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-slate-500">
                Nitelikler
                <span className="ml-1 font-medium text-slate-400">
                  {filteredAttributes.length}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {filteredAttributes.map((attribute) => (
                <AttributeCard
                  key={attribute.id}
                  attribute={attribute}
                  onEdit={handleEditAttribute}
                  onAddValue={handleOpenValueModal}
                  onEditValue={handleEditValue}
                />
              ))}

              {filteredAttributes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-14 text-center">
                  <p className="text-[14px] font-semibold text-slate-800">
                    Nitelik bulunamadı
                  </p>
                  <p className="mt-1 max-w-sm text-[12px] text-slate-500">
                    {searchQuery
                      ? `“${searchQuery}” ile eşleşen nitelik yok.`
                      : "Henüz ürün niteliği tanımlanmamış."}
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateAttribute}
                    className="mt-4"
                  >
                    İlk niteliği oluştur
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "all" || activeTab === "brands" ? (
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-[13px] font-semibold text-slate-900">
                  Markalar
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {filteredBrands.length} / {brands.length} marka
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleCreateBrand}>
                Marka ekle
              </Button>
            </header>

            {brandRunner.error ? (
              <p
                role="alert"
                className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[12px] font-medium text-red-700"
              >
                {brandRunner.error}
              </p>
            ) : null}

            <ul className="divide-y divide-slate-100">
              {filteredBrands.map((brand) => (
                <li
                  key={brand.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                      {brandInitial(brand.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {brand.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {brand.productCount === 0
                          ? "Ürün bağlı değil"
                          : `${brand.productCount} ürün`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditBrand(brand)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={
                        brandRunner.pending || brand.productCount > 0
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `“${brand.name}” markasını silmek istediğinize emin misiniz?`,
                          )
                        ) {
                          brandRunner.run(() => deleteBrandAction(brand.id));
                        }
                      }}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                      title={
                        brand.productCount > 0
                          ? "Ürünü olan marka silinemez"
                          : "Markayı sil"
                      }
                    >
                      Sil
                    </Button>
                  </div>
                </li>
              ))}

              {filteredBrands.length === 0 ? (
                <li className="flex flex-col items-center justify-center px-4 py-14 text-center">
                  <p className="text-[14px] font-semibold text-slate-800">
                    Marka bulunamadı
                  </p>
                  <p className="mt-1 max-w-sm text-[12px] text-slate-500">
                    {searchQuery
                      ? `“${searchQuery}” ile eşleşen marka yok.`
                      : "Henüz marka eklenmemiş."}
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateBrand}
                    className="mt-4"
                  >
                    Marka ekle
                  </Button>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
