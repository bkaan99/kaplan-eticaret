"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canBeParent } from "@/modules/admin/taxonomy/category.logic";
import { slugify } from "@/shared/slug";
import { type CategoryRow, type FormState } from "./category-form";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: CategoryRow[];
  pending: boolean;
  onSave: () => void;
  message: { text: string; error: boolean } | null;
}

export function CategoryModal({
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
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
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
                className="h-9 text-xs font-semibold bg-white"
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
                  className="h-9 pl-20 font-mono text-xs text-slate-800 bg-white"
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
                className="h-9 text-xs font-medium bg-white"
              >
                <option value="">Ana Kategori (En Üst Seviye)</option>
                {categories
                  .filter((cat) =>
                    canBeParent(categories, form.id ?? "", cat.id),
                  )
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
                  className="h-9 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
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
                placeholder="/images/kategoriler/klasik-tursular.webp veya https://..."
                className="h-9 text-xs font-mono flex-1 bg-white"
              />
              {form.imageUrl && (
                <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
            className="h-9 px-3.5 text-[13px] font-medium text-slate-600 hover:bg-white cursor-pointer"
          >
            Vazgeç
          </Button>

          <Button
            type="button"
            disabled={pending || !form.name.trim()}
            onClick={onSave}
            className="h-9 bg-emerald-700 px-4 text-[13px] font-semibold text-white shadow-2xs hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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
