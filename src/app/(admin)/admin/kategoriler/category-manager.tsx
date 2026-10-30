"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canBeParent } from "@/modules/admin/taxonomy/category.logic";
import { slugify } from "@/shared/slug";
import { deleteCategoryAction, saveCategoryAction } from "./actions";

export interface CategoryRow {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  depth: number;
}

interface FormState {
  id: string | null;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
}

const blank: FormState = {
  id: null,
  name: "",
  slug: "",
  parentId: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
  seoTitle: "",
  seoDescription: "",
};

function fromRow(row: CategoryRow): FormState {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? "",
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    sortOrder: String(row.sortOrder),
    isActive: row.isActive,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: CategoryRow[];
  pending: boolean;
  onSave: () => void;
  message: { text: string; error: boolean } | null;
}

function CategoryModal({
  isOpen,
  onClose,
  form,
  setForm,
  categories,
  pending,
  onSave,
  message,
}: CategoryModalProps) {
  const [autoSlug, setAutoSlug] = useState(true);
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Edit modundaysa autoSlug false, yeni ekleme ise true
    setAutoSlug(!form.id);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, form.id, onClose]);

  if (!isOpen) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function handleNameChange(newName: string) {
    setForm((current) => ({
      ...current,
      name: newName,
      slug: autoSlug && !current.id ? slugify(newName) : current.slug,
    }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Kutusu */}
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              {form.id ? "✏️" : "📁"}
            </span>
            <div>
              <h2
                id="category-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {form.id ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {form.id
                  ? `/${form.slug} kategorisini güncelliyorsunuz`
                  : "Mağazanıza yeni bir ürün kategorisi tanımlayın"}
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

        {/* Modal İçerik (Kaydırılabilir) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
          {message && (
            <div
              role={message.error ? "alert" : "status"}
              className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span>{message.error ? "⚠️" : "✓"}</span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Kategori Adı ve URL */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kategori Adı <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Örn: Klasik Turşular"
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Adres (URL Slug)
                </label>
                {!form.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(!autoSlug);
                      if (!autoSlug) set("slug", slugify(form.name));
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {autoSlug ? "⚡ Otomatik" : "Manuel"}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  /kategori/
                </span>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    set("slug", e.target.value);
                  }}
                  placeholder="klasik-tursular"
                  className="h-10 pl-20 font-mono text-xs text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Üst Kategori ve Sıra */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Üst Kategori
              </label>
              <Select
                value={form.parentId}
                onChange={(e) => set("parentId", e.target.value)}
                className="h-10 text-xs font-medium bg-white"
              >
                <option value="">Ana Kategori (En Üst Seviye)</option>
                {categories
                  .filter((cat) => canBeParent(categories, form.id ?? "", cat.id))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {"— ".repeat(cat.depth)}
                      {cat.name}
                    </option>
                  ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Görüntüleme Sırası
                </label>
                <Input
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    form.isActive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      form.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span>{form.isActive ? "Aktif" : "Pasif"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kategori Görseli */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Kategori Görseli URL
            </label>
            <div className="flex gap-2.5 items-center">
              <Input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="/images/kategori/klasik.jpg veya https://..."
                className="h-10 text-xs font-mono flex-1 bg-white"
              />
              {form.imageUrl && (
                <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <Image
                    src={form.imageUrl}
                    alt="Önizleme"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          {/* Açıklama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Açıklama (Tanıtım Metni)
            </label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Kategori sayfasında müşterilere gösterilecek kısa tanıtım metni..."
              className="text-xs leading-relaxed bg-white"
            />
          </div>

          {/* SEO Ayarları */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔍</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                SEO (Arama Motoru) Ayarları
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>SEO Başlığı (Title)</span>
                <span>{form.seoTitle.length}/70</span>
              </div>
              <Input
                value={form.seoTitle}
                maxLength={70}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder="Örn: Ev Yapımı Klasik Turşular | Kaplan Gurme"
                className="h-9 text-xs bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>SEO Açıklaması (Meta Description)</span>
                <span>{form.seoDescription.length}/160</span>
              </div>
              <Textarea
                rows={2}
                maxLength={160}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                placeholder="Google aramalarında çıkacak özet açıklama..."
                className="text-xs bg-white leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
            type="button"
            disabled={pending || !form.name.trim()}
            onClick={onSave}
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
                  {form.id ? "Değişiklikleri Güncelle" : "Kategoriyi Kaydet"}
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [form, setForm] = useState<FormState>(blank);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  // İstatistikler
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const root = categories.filter((c) => c.depth === 0).length;
    const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);
    return { total, active, root, totalProducts };
  }, [categories]);

  // Filtrelenmiş kategori listesi
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  function handleCreateNew(parentId?: string) {
    setForm({
      ...blank,
      parentId: parentId ?? "",
    });
    setMessage(null);
    setIsModalOpen(true);
  }

  function handleEdit(category: CategoryRow) {
    setForm(fromRow(category));
    setMessage(null);
    setIsModalOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      setMessage({ text: "Kategori adı zorunludur.", error: true });
      return;
    }

    startTransition(async () => {
      const result = await saveCategoryAction(form.id, {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        parentId: form.parentId || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
      });

      if (result.ok) {
        setMessage({
          text: form.id
            ? "Kategori başarıyla güncellendi."
            : "Yeni kategori başarıyla oluşturuldu.",
          error: false,
        });
        setIsModalOpen(false);
      } else {
        setMessage({ text: result.error ?? "Kaydedilemedi", error: true });
      }
    });
  }

  function remove(id: string, name: string) {
    if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.ok) {
        setMessage({ text: `"${name}" kategorisi silindi.`, error: false });
        if (form.id === id) {
          setIsModalOpen(false);
          setForm(blank);
        }
      } else {
        setMessage({ text: result.error ?? "Kategori silinemedi.", error: true });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Modal Penceresi */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        setForm={setForm}
        categories={categories}
        pending={pending}
        onSave={handleSave}
        message={message}
      />

      {/* İstatistik ve Genel Bakış Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Toplam Kategori</span>
            <span className="text-base">📁</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Aktif (Yayında)</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ana Kategori</span>
            <span className="text-base">🗂️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.root}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ürün Bağlantısı</span>
            <span className="text-base">📦</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalProducts}
          </p>
        </div>
      </div>

      {/* Sayfa Bildirim Mesajı (Modal kapalıyken) */}
      {message && !isModalOpen && (
        <div
          role={message.error ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between ${
            message.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.error ? "⚠️" : "✓"}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kategori Listesi ve Ağaç Yapısı - Tam Genişlik */}
      <Card className="overflow-hidden shadow-xs border-slate-200/80">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Kategori Ağacı
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiyerarşik mağaza kategorileri, ürün sayıları ve durumları
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Arama Çubuğu */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                🔍
              </span>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategori adı veya URL ara..."
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

            {/* Yeni Kategori Ekle Butonu */}
            <Button
              type="button"
              onClick={() => handleCreateNew()}
              className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
            >
              + Yeni Kategori Ekle
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCategories.length > 0 ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {filteredCategories.map((category) => {
                const isRoot = category.depth === 0;

                return (
                  <li
                    key={category.id}
                    className="group flex flex-col gap-3 px-4 py-3.5 transition-all hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      paddingLeft: `${Math.max(16, 16 + category.depth * 28)}px`,
                    }}
                  >
                    {/* Sol Bilgiler */}
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      {/* Hiyerarşi İkonu */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs ${
                          isRoot
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isRoot ? "📁" : "└─"}
                      </span>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                            {category.name}
                          </span>
                          {!category.isActive ? (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                              Pasif
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                              Aktif
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-400">
                            /{category.slug}
                          </span>
                          <span>·</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.2 font-semibold text-slate-700">
                            {category.productCount} ürün
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">
                            Sıra: #{category.sortOrder}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ Eylemler */}
                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCreateNew(category.id)}
                        className="h-7.5 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                        title="Bu kategori altına alt kategori ekle"
                      >
                        + Alt Kategori
                      </Button>

                      <Link
                        href={`/kategori/${category.slug}`}
                        target="_blank"
                        title="Mağazada Görüntüle"
                        className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        ↗
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        className="h-7.5 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Düzenle
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => remove(category.id, category.name)}
                        className="h-7.5 w-7.5 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Kategoriyi Sil"
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <span className="text-4xl mb-3">📁</span>
              <p className="text-sm font-bold text-slate-800">
                Kategori bulunamadı
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? `"${searchQuery}" aramasına uygun kategori eşleşmedi.`
                  : "Sistemde henüz kayıtlı bir kategori bulunmuyor."}
              </p>
              <Button
                type="button"
                onClick={() => handleCreateNew()}
                className="mt-4 bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                + İlk Kategoriyi Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
