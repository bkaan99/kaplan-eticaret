"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addAttributeValueAction,
  createBrandAction,
  deleteAttributeAction,
  deleteAttributeValueAction,
  deleteBrandAction,
  saveAttributeAction,
} from "./actions";

export interface AttributeView {
  id: string;
  name: string;
  isFilterable: boolean;
  values: { id: string; value: string; productCount: number }[];
}

export interface BrandView {
  id: string;
  name: string;
  productCount: number;
}

function useRunner() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      setError(result.ok ? null : (result.error ?? "İşlem gerçekleştirilemedi"));
      if (result.ok) onDone?.();
    });
  }

  return { pending, error, run, setError };
}

function AttributeCard({ attribute }: { attribute: AttributeView }) {
  const { pending, error, run } = useRunner();
  const [newValue, setNewValue] = useState("");

  return (
    <Card className="transition-all hover:border-slate-300/80 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-800 font-bold">
            🏷️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                {attribute.name}
              </CardTitle>
              {attribute.isFilterable && (
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                  ⚡ Vitrin Filtresi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {attribute.values.length} tanımlı değer
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`"${attribute.name}" niteliği ve tüm değerleri silinsin mi?`)) {
              run(() => deleteAttributeAction(attribute.id));
            }
          }}
          className="h-8 px-2.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
          title="Niteliği Sil"
        >
          Sil
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4.5">
        {/* Değerler Listesi (Etiketler) */}
        <div>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Tanımlı Değerler
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {attribute.values.map((item) => (
              <span
                key={item.id}
                className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
              >
                <span>{item.value}</span>
                <span className="rounded-md bg-white px-1.5 py-0.2 text-[10px] font-bold text-slate-500 border border-slate-200">
                  {item.productCount}
                </span>
                <button
                  type="button"
                  aria-label={`${item.value} değerini sil`}
                  disabled={pending}
                  onClick={() => run(() => deleteAttributeValueAction(item.id))}
                  className="ml-0.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  title="Değeri Kaldır"
                >
                  ✕
                </button>
              </span>
            ))}

            {attribute.values.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Henüz değer tanımlanmadı.
              </span>
            )}
          </div>
        </div>

        {/* Yeni Değer Ekleme Formu */}
        <form
          className="flex items-center gap-2 pt-2 border-t border-slate-100"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newValue.trim()) return;
            run(
              () => addAttributeValueAction(attribute.id, newValue.trim()),
              () => setNewValue(""),
            );
          }}
        >
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`"${attribute.name}" için yeni değer yazın...`}
            aria-label="Yeni değer"
            className="h-8.5 text-xs flex-1 bg-white"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={pending || !newValue.trim()}
            className="h-8.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Ekle
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            ⚠️ {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AttributeManager({
  attributes,
  brands,
}: {
  attributes: AttributeView[];
  brands: BrandView[];
}) {
  const attrRunner = useRunner();
  const brandRunner = useRunner();
  const [attributeName, setAttributeName] = useState("");
  const [isFilterable, setIsFilterable] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "attributes" | "brands">("all");

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

  return (
    <div className="flex flex-col gap-6">
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

      {/* Kontrol ve Filtre Çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Ana Çift Kolonlu İçerik Alanı */}
      <div
        className={`grid gap-6 items-start ${
          activeTab === "all"
            ? "lg:grid-cols-[1.25fr_1fr]"
            : "grid-cols-1"
        }`}
      >
        {/* Nitelikler Bölümü */}
        {(activeTab === "all" || activeTab === "attributes") && (
          <div className="flex flex-col gap-5">
            {/* Yeni Nitelik Oluşturma Kartı */}
            <Card className="border-emerald-200/80 bg-linear-to-br from-white via-white to-emerald-50/40 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Yeni Nitelik Tanımla
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ürünlerin filtrelenebilmesi için yeni bir özellik başlığı açın
                </p>
              </CardHeader>
              <CardContent>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!attributeName.trim()) return;
                    attrRunner.run(
                      () =>
                        saveAttributeAction(null, {
                          name: attributeName.trim(),
                          isFilterable,
                        }),
                      () => setAttributeName(""),
                    );
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Input
                      value={attributeName}
                      onChange={(e) => setAttributeName(e.target.value)}
                      placeholder="Örn: Acılık Seviyesi, Fermantasyon Türü, Tuz Oranı..."
                      aria-label="Nitelik adı"
                      className="h-9.5 text-xs font-medium flex-1 bg-white"
                    />
                    <Button
                      type="submit"
                      disabled={attrRunner.pending || !attributeName.trim()}
                      className="h-9.5 bg-emerald-700 px-4 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                    >
                      {attrRunner.pending ? "Oluşturuluyor..." : "+ Nitelik Oluştur"}
                    </Button>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isFilterable}
                      onChange={(e) => setIsFilterable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Vitrinde filtre olarak gösterilsin (Müşteriler filtreleme yapabilsin)</span>
                  </label>

                  {attrRunner.error && (
                    <p role="alert" className="text-xs font-semibold text-red-600">
                      ⚠️ {attrRunner.error}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Mevcut Nitelik Kartları */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tanımlı Nitelikler ({filteredAttributes.length})
                </span>
              </div>

              {filteredAttributes.map((attribute) => (
                <AttributeCard key={attribute.id} attribute={attribute} />
              ))}

              {filteredAttributes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 text-center">
                  <span className="text-3xl mb-2">🏷️</span>
                  <p className="text-sm font-bold text-slate-800">
                    Nitelik bulunamadı
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {searchQuery
                      ? `"${searchQuery}" aramasına uygun nitelik eşleşmedi.`
                      : "Henüz hiçbir ürün niteliği tanımlanmamış."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Markalar Bölümü */}
        {(activeTab === "all" || activeTab === "brands") && (
          <div className="flex flex-col gap-5">
            {/* Markalar Kartı */}
            <Card className="shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-900 font-bold">
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
              </CardHeader>

              <CardContent className="flex flex-col gap-4 p-4.5">
                {/* Yeni Marka Ekle Formu */}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!brandName.trim()) return;
                    brandRunner.run(
                      () => createBrandAction(brandName.trim()),
                      () => setBrandName(""),
                    );
                  }}
                >
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Yeni marka adı (örn: Kaplan Gurme)..."
                    aria-label="Yeni marka"
                    className="h-9 text-xs flex-1 bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={brandRunner.pending || !brandName.trim()}
                    className="h-9 bg-slate-900 px-3.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    {brandRunner.pending ? "..." : "+ Ekle"}
                  </Button>
                </form>

                {brandRunner.error && (
                  <p role="alert" className="text-xs font-semibold text-red-600">
                    ⚠️ {brandRunner.error}
                  </p>
                )}

                {/* Marka Listesi */}
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="group flex items-center justify-between p-3 transition hover:bg-slate-50/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {brand.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {brand.name}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {brand.productCount} ürün bağlı
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={brandRunner.pending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${brand.name}" markasını silmek istediğinize emin misiniz?`,
                            )
                          ) {
                            brandRunner.run(() => deleteBrandAction(brand.id));
                          }
                        }}
                        className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Markayı Sil"
                      >
                        ✕ Sil
                      </button>
                    </div>
                  ))}

                  {filteredBrands.length === 0 && (
                    <div className="py-8 px-4 text-center">
                      <span className="text-2xl mb-1">🏢</span>
                      <p className="text-xs font-bold text-slate-700">
                        Marka bulunamadı
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {searchQuery
                          ? `"${searchQuery}" ile eşleşen marka yok.`
                          : "Henüz bir marka eklenmedi."}
                      </p>
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
