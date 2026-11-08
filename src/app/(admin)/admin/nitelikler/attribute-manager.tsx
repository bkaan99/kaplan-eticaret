"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteBrandAction } from "./actions";
import { AttributeCard } from "./attribute-card";
import { AttributeModal } from "./attribute-modal";
import { type AttributeView, type BrandView } from "./attribute-types";
import { BrandModal } from "./brand-modal";
import { AttributeValueModal } from "./value-modal";
export type { AttributeView, BrandView } from "./attribute-types";

export function AttributeManager({
  attributes,
  brands,
}: {
  attributes: AttributeView[];
  brands: BrandView[];
}) {
  const brandRunner = useActionRunner();

  // Modallar
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
  const [activeTab, setActiveTab] = useState<"all" | "attributes" | "brands">(
    "all",
  );

  // İstatistikler
  const stats = useMemo(() => {
    const totalAttr = attributes.length;
    const totalValues = attributes.reduce((acc, a) => acc + a.values.length, 0);
    const filterableCount = attributes.filter((a) => a.isFilterable).length;
    const totalBrands = brands.length;
    return { totalAttr, totalValues, filterableCount, totalBrands };
  }, [attributes, brands]);

  // Filtrelenmiş nitelikler
  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) return attributes;
    const q = searchQuery.toLowerCase().trim();
    return attributes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.values.some((v) => v.value.toLowerCase().includes(q)),
    );
  }, [attributes, searchQuery]);

  // Filtrelenmiş markalar
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

  return (
    <div className="flex flex-col gap-6">
      {/* Modallar */}
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

      {/* Üst İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Toplam Nitelik</span>
            <span className="text-base">🏷️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalAttr}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tanımlı Değerler</span>
            <span className="text-base">🔖</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
            {stats.totalValues}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Vitrin Filtresi</span>
            <span className="text-base">⚡</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-sky-700">
            {stats.filterableCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kayıtlı Marka</span>
            <span className="text-base">🏢</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalBrands}
          </p>
        </div>
      </div>

      {/* Kontrol, Filtre ve Eylem Çubuğu */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Sol: Sekmeler ve Arama */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Sekmeler */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tüm Görünüm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attributes")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "attributes"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Nitelikler</span>
              <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px]">
                {attributes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("brands")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "brands"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Markalar</span>
              <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px]">
                {brands.length}
              </span>
            </button>
          </div>

          {/* Arama Alanı */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nitelik, değer veya marka ara..."
              className="h-9 pl-8 text-xs bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sağ: Yeni Ekleme Modal Tetikleyici Butonları */}
        <div className="flex items-center gap-2.5">
          {(activeTab === "all" || activeTab === "attributes") && (
            <Button
              type="button"
              onClick={handleCreateAttribute}
              className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 cursor-pointer"
            >
              + Yeni Nitelik Tanımla
            </Button>
          )}

          {(activeTab === "all" || activeTab === "brands") && (
            <Button
              type="button"
              onClick={handleCreateBrand}
              className="h-9 bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 cursor-pointer"
            >
              + Yeni Marka Ekle
            </Button>
          )}
        </div>
      </div>

      {/* Ana Çift Kolonlu İçerik Alanı (Artık sayfa içinde açık formlar yok) */}
      <div
        className={`grid gap-6 items-start ${
          activeTab === "all" ? "lg:grid-cols-[1.3fr_1fr]" : "grid-cols-1"
        }`}
      >
        {/* Nitelikler Bölümü */}
        {(activeTab === "all" || activeTab === "attributes") && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tanımlı Nitelikler ({filteredAttributes.length})
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {filteredAttributes.map((attribute) => (
                <AttributeCard
                  key={attribute.id}
                  attribute={attribute}
                  onEdit={handleEditAttribute}
                  onAddValue={handleOpenValueModal}
                  onEditValue={handleEditValue}
                />
              ))}

              {filteredAttributes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 bg-white text-center">
                  <span className="text-3xl mb-2">🏷️</span>
                  <p className="text-sm font-bold text-slate-800">
                    Nitelik bulunamadı
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {searchQuery
                      ? `"${searchQuery}" aramasına uygun nitelik eşleşmedi.`
                      : "Henüz hiçbir ürün niteliği tanımlanmamış."}
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateAttribute}
                    className="mt-4 bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    + İlk Niteliği Tanımla
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Markalar Bölümü */}
        {(activeTab === "all" || activeTab === "brands") && (
          <div className="flex flex-col gap-4">
            <Card className="shadow-xs border-slate-200/80 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs text-amber-900 font-bold shadow-2xs">
                    🏢
                  </span>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Markalar ve Üreticiler
                    </CardTitle>
                    <p className="text-[11px] text-slate-500">
                      {brands.length} kayıtlı marka
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateBrand}
                  className="h-8 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  + Marka Ekle
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {/* Marka Listesi */}
                <div className="divide-y divide-slate-100 bg-white">
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="group flex items-center justify-between p-3.5 transition hover:bg-slate-50/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs">
                          {brand.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                            {brand.name}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {brand.productCount} ürün bağlı
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditBrand(brand)}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Markayı düzenle"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          disabled={
                            brandRunner.pending || brand.productCount > 0
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                `"${brand.name}" markasını silmek istediğinize emin misiniz?`,
                              )
                            ) {
                              brandRunner.run(() =>
                                deleteBrandAction(brand.id),
                              );
                            }
                          }}
                          className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer disabled:opacity-40"
                          title={
                            brand.productCount > 0
                              ? "Ürünü olan marka silinemez"
                              : "Markayı sil"
                          }
                        >
                          ✕ Sil
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredBrands.length === 0 && (
                    <div className="py-12 px-4 text-center">
                      <span className="text-3xl mb-1">🏢</span>
                      <p className="text-xs font-bold text-slate-700">
                        Marka bulunamadı
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {searchQuery
                          ? `"${searchQuery}" ile eşleşen marka yok.`
                          : "Henüz bir marka eklenmedi."}
                      </p>
                      <Button
                        type="button"
                        onClick={handleCreateBrand}
                        className="mt-3 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        + Marka Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
