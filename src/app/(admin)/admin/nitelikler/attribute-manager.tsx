"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

/* -------------------------------------------------------------------------- */
/*                               ATTRIBUTE MODAL                              */
/* -------------------------------------------------------------------------- */

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAttribute: { id: string | null; name: string; isFilterable: boolean } | null;
  onSuccess?: () => void;
}

function AttributeModal({
  isOpen,
  onClose,
  editingAttribute,
  onSuccess,
}: AttributeModalProps) {
  const { pending, error, run, setError } = useRunner();
  const [name, setName] = useState("");
  const [isFilterable, setIsFilterable] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingAttribute) {
      setName(editingAttribute.name);
      setIsFilterable(editingAttribute.isFilterable);
    } else {
      setName("");
      setIsFilterable(true);
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, editingAttribute, onClose, setError]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    run(
      () =>
        saveAttributeAction(editingAttribute?.id ?? null, {
          name: name.trim(),
          isFilterable,
        }),
      () => {
        onSuccess?.();
        onClose();
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attribute-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🏷️
            </span>
            <div>
              <h2
                id="attribute-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingAttribute?.id ? "Niteliği Düzenle" : "Yeni Nitelik Tanımla"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ürünlerin filtrelenebilmesi için özellik başlığı belirleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nitelik Başlığı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Acılık Seviyesi, Tuz Oranı, Fermantasyon Türü..."
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFilterable}
                  onChange={(e) => setIsFilterable(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-900">
                    Vitrinde Filtre Olarak Gösterilsin
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Müşteriler kategori veya mağaza sayfasında ürünleri bu niteliğe
                    göre filtreleyebilsin (örn: Tatlı, Orta Acı, Ekşi).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Kaydediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>💾</span>
                  <span>
                    {editingAttribute?.id
                      ? "Değişiklikleri Güncelle"
                      : "Niteliği Kaydet"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 BRAND MODAL                                */
/* -------------------------------------------------------------------------- */

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function BrandModal({ isOpen, onClose, onSuccess }: BrandModalProps) {
  const { pending, error, run, setError } = useRunner();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setName("");

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, setError]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    run(
      () => createBrandAction(name.trim()),
      () => {
        onSuccess?.();
        onClose();
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-amber-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-lg shadow-2xs">
              🏢
            </span>
            <div>
              <h2
                id="brand-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Yeni Marka / Üretici Ekle
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Katalog ürünleri için marka kaydı açın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Marka / Üretici Adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Kaplan Gurme, Çubuk Lezzetleri..."
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              className="h-10 bg-slate-900 px-6 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Ekleniyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>Markayı Kaydet</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            ATTRIBUTE VALUE MODAL                           */
/* -------------------------------------------------------------------------- */

interface ValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: AttributeView | null;
  onSuccess?: () => void;
}

function AttributeValueModal({
  isOpen,
  onClose,
  attribute,
  onSuccess,
}: ValueModalProps) {
  const { pending, error, run, setError } = useRunner();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setValue("");

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, setError]);

  if (!isOpen || !attribute) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || !attribute) return;

    run(
      () => addAttributeValueAction(attribute.id, value.trim()),
      () => {
        onSuccess?.();
        onClose();
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="value-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🔖
            </span>
            <div>
              <h2
                id="value-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Yeni Değer Ekle
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                &ldquo;{attribute.name}&rdquo; niteliği için yeni seçenek
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Değer Adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Örn: Az Acılı, Çok Acılı, Tatlı, 3 Litre..."
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={pending || !value.trim()}
              className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Ekleniyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>+</span>
                  <span>Değeri Ekle</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               ATTRIBUTE CARD                               */
/* -------------------------------------------------------------------------- */

function AttributeCard({
  attribute,
  onEdit,
  onAddValue,
}: {
  attribute: AttributeView;
  onEdit: (attribute: AttributeView) => void;
  onAddValue: (attribute: AttributeView) => void;
}) {
  const { pending, error, run } = useRunner();

  return (
    <Card className="transition-all hover:border-slate-300/80 shadow-2xs border-slate-200/80 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs text-emerald-800 font-bold shadow-2xs">
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

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(attribute)}
            className="h-8 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            Düzenle
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `"${attribute.name}" niteliği ve tüm değerleri silinsin mi?`,
                )
              ) {
                run(() => deleteAttributeAction(attribute.id));
              }
            }}
            className="h-8 px-2.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            title="Niteliği Sil"
          >
            Sil
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Değerler Listesi (Etiketler) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Tanımlı Değerler
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddValue(attribute)}
              className="h-6.5 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
            >
              + Değer Ekle
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
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
                Henüz değer tanımlanmadı. &ldquo;+ Değer Ekle&rdquo; ile ekleyebilirsiniz.
              </span>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            ⚠️ {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                              ATTRIBUTE MANAGER                             */
/* -------------------------------------------------------------------------- */

export function AttributeManager({
  attributes,
  brands,
}: {
  attributes: AttributeView[];
  brands: BrandView[];
}) {
  const brandRunner = useRunner();

  // Modallar
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<{
    id: string | null;
    name: string;
    isFilterable: boolean;
  } | null>(null);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [selectedAttributeForValue, setSelectedAttributeForValue] =
    useState<AttributeView | null>(null);

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
    setIsValueModalOpen(true);
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
        onClose={() => setIsBrandModalOpen(false)}
      />

      <AttributeValueModal
        isOpen={isValueModalOpen}
        onClose={() => setIsValueModalOpen(false)}
        attribute={selectedAttributeForValue}
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
              onClick={() => setIsBrandModalOpen(true)}
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
          activeTab === "all"
            ? "lg:grid-cols-[1.3fr_1fr]"
            : "grid-cols-1"
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
                  onClick={() => setIsBrandModalOpen(true)}
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
                        onClick={() => setIsBrandModalOpen(true)}
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
