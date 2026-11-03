"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { RichText } from "@/components/content/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/shared/slug";
import {
  deleteBannerAction,
  deletePageAction,
  saveBannerAction,
  saveMenuAction,
  savePageAction,
} from "./actions";

export interface BannerRow {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export interface PageRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface MenuItemRow {
  label: string;
  url: string;
}

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

function useRunner() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.ok
          ? { text: "İşlem başarıyla kaydedildi.", error: false }
          : { text: result.error ?? "İşlem sırasında bir hata oluştu.", error: true },
      );
      if (result.ok) onDone?.();
    });
  }

  return { pending, message, setMessage, run };
}

function Notice({
  message,
  onDismiss,
}: {
  message: { text: string; error: boolean } | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role={message.error ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
        message.error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{message.error ? "⚠️" : "✓"}</span>
        <span>{message.text}</span>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               BANNER MODAL                                 */
/* -------------------------------------------------------------------------- */

type BannerFormState = {
  id: string | null;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const blankBanner: BannerFormState = {
  id: null,
  title: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function BannerModal({
  open,
  form,
  pending,
  message,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: BannerFormState;
  pending: boolean;
  message: { text: string; error: boolean } | null;
  onClose: () => void;
  onChange: <K extends keyof BannerFormState>(
    key: K,
    value: BannerFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleFileUpload(file: File) {
    setUploadError(null);
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/admin/yukle", { method: "POST", body });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setUploadError(result.error ?? "Görsel yüklenemedi.");
        return;
      }
      onChange("imageUrl", result.url);
    } catch {
      setUploadError("Görsel yüklenirken bağlantı hatası oluştu.");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-bold text-slate-900">
              {form.id ? "Bannerı Düzenle" : "Yeni Banner Ekle"}
            </h2>
            <p className="text-xs text-slate-500">
              Ana sayfa vitrininde öne çıkacak görsel ve bağlantı ayarları.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6 text-sm">
          {/* Başlık */}
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-slate-800">Banner Başlığı</Label>
            <Input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Örn: Yeni Hasat Çubuk Turşuları Çıktı!"
              className="rounded-xl"
            />
          </div>

          {/* Görsel Adresi & Dosya Yükleme */}
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-slate-800">Banner Görseli</Label>
            <div className="flex gap-2">
              <Input
                value={form.imageUrl}
                onChange={(e) => onChange("imageUrl", e.target.value)}
                placeholder="/images/banner/... veya dosya yükleyin"
                className="rounded-xl flex-1 font-mono text-xs"
              />
              <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition">
                <span>📁 {uploading ? "Yükleniyor..." : "Dosya Seç"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {uploadError ? (
              <p className="text-xs text-red-600 font-medium">{uploadError}</p>
            ) : null}

            {/* Görsel Önizleme */}
            {form.imageUrl.trim() ? (
              <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt={form.title || "Önizleme"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          {/* Tıklama Bağlantısı */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-800">Tıklama Bağlantısı</Label>
              <span className="text-[11px] text-slate-400">İsteğe bağlı</span>
            </div>
            <Input
              value={form.linkUrl}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              placeholder="/kategori/klasik-tursular veya /kendi-tursunu-yap"
              className="rounded-xl font-mono text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["/kategori/klasik-tursular", "/kendi-tursunu-yap", "/ara"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => onChange("linkUrl", sample)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Sıra */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">Gösterim Sırası</Label>
              <Input
                value={form.sortOrder}
                onChange={(e) => onChange("sortOrder", e.target.value)}
                inputMode="numeric"
                className="rounded-xl"
              />
            </div>
            {/* Başlangıç Tarihi */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">Yayın Başlangıcı</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => onChange("startsAt", e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            {/* Bitiş Tarihi */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">Yayın Bitişi</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => onChange("endsAt", e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Aktiflik Switch */}
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm font-semibold text-slate-800 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Bu banner ana sayfada aktif olarak gösterilsin</span>
          </label>

          <Notice message={message} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.title.trim()}
            onClick={onSave}
            className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {pending ? "Kaydediliyor..." : form.id ? "Değişiklikleri Kaydet" : "Bannerı Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               BANNER BÖLÜMÜ                                */
/* -------------------------------------------------------------------------- */

function BannerSection({ banners }: { banners: BannerRow[] }) {
  const { pending, message, setMessage, run } = useRunner();
  const [form, setForm] = useState<BannerFormState>(blankBanner);
  const [open, setOpen] = useState(false);

  const set = <K extends keyof BannerFormState>(
    key: K,
    value: BannerFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  function openCreate() {
    setForm(blankBanner);
    setOpen(true);
  }

  function openEdit(banner: BannerRow) {
    setForm({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? "",
      sortOrder: String(banner.sortOrder),
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
      isActive: banner.isActive,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setForm(blankBanner);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Ana Sayfa Bannerları</h2>
          <p className="text-xs text-slate-500">
            Vitrin sliderında dönecek görselleri, kampanya afişlerini ve yönlendirmeleri yönetin.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
        >
          <span>＋ Yeni Banner Ekle</span>
        </Button>
      </div>

      <Notice message={!open ? message : null} onDismiss={() => setMessage(null)} />

      {banners.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400 mb-3">
            🖼️
          </div>
          <p className="font-semibold text-slate-800">Henüz banner eklenmemiş</p>
          <p className="mt-1 text-xs text-slate-500">
            Ana sayfa vitrininde öne çıkarmak istediğiniz kampanya ve görseller için yukarıdaki butonu kullanın.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card
              key={banner.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                {banner.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 font-medium">
                    Görsel yok
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge tone={banner.isActive ? "success" : "warning"}>
                    {banner.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  Sıra: {banner.sortOrder}
                </div>
              </div>

              <CardContent className="p-4 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 truncate" title={banner.title}>
                    {banner.title}
                  </h3>
                  {banner.linkUrl ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500 font-mono" title={banner.linkUrl}>
                      🔗 {banner.linkUrl}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400">Bağlantı atanmamış</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(banner)}
                    className="h-8 rounded-lg text-xs"
                  >
                    ✏️ Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`"${banner.title}" bannerı silinsin mi?`)) {
                        run(() => deleteBannerAction(banner.id));
                      }
                    }}
                    className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BannerModal
        open={open}
        form={form}
        pending={pending}
        message={message}
        onClose={closeModal}
        onChange={set}
        onSave={() =>
          run(
            () => saveBannerAction(form.id, form),
            () => closeModal(),
          )
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SAYFA BÖLÜMÜ                                */
/* -------------------------------------------------------------------------- */

const blankPage = {
  id: null as string | null,
  title: "",
  slug: "",
  content: "",
  isPublished: true,
  seoTitle: "",
  seoDescription: "",
};

function PageSection({ pages }: { pages: PageRow[] }) {
  const { pending, message, setMessage, run } = useRunner();
  const [form, setForm] = useState(blankPage);
  const [search, setSearch] = useState("");
  const [tabMode, setTabMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof typeof blankPage>(
    key: K,
    value: (typeof blankPage)[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  function insertMarkdown(prefix: string, suffix: string = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = form.content.slice(start, end);
    const replacement = `${prefix}${sel || "metin"}${suffix}`;
    const nextContent =
      form.content.slice(0, start) + replacement + form.content.slice(end);
    set("content", nextContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (sel.length || 5),
      );
    }, 10);
  }

  function handleSelectPage(page: PageRow) {
    setForm({
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      isPublished: page.isPublished,
      seoTitle: page.seoTitle ?? "",
      seoDescription: page.seoDescription ?? "",
    });
    setTabMode("edit");
    setMessage(null);
  }

  function handleCreateNew() {
    setForm(blankPage);
    setTabMode("edit");
    setMessage(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <Notice message={message} onDismiss={() => setMessage(null)} />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Sol Sütun: Sayfalar Listesi (~4 Sütun) */}
        <aside className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mevcut Sayfalar ({filteredPages.length})
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateNew}
              className="h-8 rounded-xl bg-emerald-700 text-xs text-white hover:bg-emerald-800 shadow-xs"
            >
              ＋ Yeni Sayfa
            </Button>
          </div>

          {/* Sayfa Arama */}
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sayfa ara..."
              className="h-9 rounded-xl pl-8 text-xs bg-white"
            />
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          {/* Sayfa Listesi */}
          <div className="flex max-h-[640px] flex-col gap-1.5 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs">
            {filteredPages.map((page) => {
              const active = form.id === page.id;
              return (
                <div
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`group flex cursor-pointer flex-col gap-1 rounded-xl p-3 text-xs transition-all ${
                    active
                      ? "bg-emerald-50/80 border border-emerald-200 text-emerald-950 shadow-2xs"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold truncate text-slate-900 group-hover:text-emerald-800">
                      {page.title}
                    </span>
                    <Badge tone={page.isPublished ? "success" : "warning"} className="shrink-0">
                      {page.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span className="truncate font-mono text-slate-500">
                      /sayfa/{page.slug}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/sayfa/${page.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Sayfayı sitede görüntüle"
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-800"
                      >
                        ↗
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${page.title}" sayfası silinsin mi?`)) {
                            run(() => deletePageAction(page.id));
                          }
                        }}
                        title="Sayfayı sil"
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredPages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Eşleşen sayfa bulunamadı.
              </div>
            ) : null}
          </div>
        </aside>

        {/* Sağ Sütun: Sayfa İçerik Editörü (~8 Sütun) */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {form.id ? `Sayfayı Düzenle: ${form.title}` : "Yeni Sayfa Oluştur"}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Markdown formatında zengin metin düzenleme ve anlık önizleme.
                </p>
              </div>

              {/* Edit vs Preview Toggle */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setTabMode("edit")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    tabMode === "edit"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  ✏️ Editör
                </button>
                <button
                  type="button"
                  onClick={() => setTabMode("preview")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    tabMode === "preview"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  👁️ Canlı Önizleme
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-6">
              {/* Başlık ve Slug */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-slate-800">Sayfa Başlığı</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      set("title", title);
                      if (!form.id && !form.slug) {
                        set("slug", slugify(title));
                      }
                    }}
                    placeholder="Örn: Hakkımızda, SSS, İade Koşulları"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-slate-800">Sayfa Adresi (Slug)</Label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                    <span className="text-xs text-slate-400 font-mono">/sayfa/</span>
                    <input
                      value={form.slug}
                      onChange={(e) => set("slug", slugify(e.target.value))}
                      placeholder="hakkimizda"
                      className="h-10 w-full bg-transparent pl-1 text-xs font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Düzenleme Alanı veya Önizleme */}
              {tabMode === "edit" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-semibold text-slate-800">Sayfa İçeriği</Label>
                    {/* Markdown Hızlı Biçimlendirme Araç Çubuğu */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => insertMarkdown("**", "**")}
                        title="Kalın"
                        className="rounded border border-slate-200 px-2 py-0.5 font-bold hover:bg-slate-100"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("# ")}
                        title="Ana Başlık (H1)"
                        className="rounded border border-slate-200 px-2 py-0.5 font-bold hover:bg-slate-100"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("## ")}
                        title="Alt Başlık (H2)"
                        className="rounded border border-slate-200 px-2 py-0.5 font-bold hover:bg-slate-100"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("- ")}
                        title="Madde İşareti"
                        className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-100"
                      >
                        • Liste
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("[", "](https://...)")}
                        title="Bağlantı"
                        className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-100"
                      >
                        🔗 Link
                      </button>
                    </div>
                  </div>

                  <Textarea
                    ref={textareaRef}
                    rows={16}
                    value={form.content}
                    onChange={(e) => set("content", e.target.value)}
                    placeholder="# Başlık 1&#10;&#10;İçerik paragrafı burada yer alır. **Kalın** metinler ve listeler ekleyebilirsiniz:&#10;&#10;- İlk madde&#10;- İkinci madde"
                    className="rounded-xl font-mono text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 İpucu: Güvenlik için HTML etiketleri yerine Markdown kullanın. Boş satır bırakarak yeni paragraflar oluşturabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 min-h-[360px]">
                  <header className="mb-4 border-b border-slate-200 pb-3">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 rounded-full px-2.5 py-0.5">
                      Canlı Önizleme
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-2">
                      {form.title || "Başlıksız Sayfa"}
                    </h2>
                  </header>
                  {form.content.trim() ? (
                    <RichText source={form.content} />
                  ) : (
                    <p className="text-sm text-slate-400 italic">İçerik henüz girilmedi.</p>
                  )}
                </div>
              )}

              {/* SEO Alanları */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  🔍 SEO ve Arama Motoru Ayarları
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <Label className="text-slate-700">SEO Başlığı</Label>
                      <span className="text-slate-400 text-[10px]">{form.seoTitle.length}/70</span>
                    </div>
                    <Input
                      value={form.seoTitle}
                      maxLength={70}
                      onChange={(e) => set("seoTitle", e.target.value)}
                      placeholder="Boşsa sayfa başlığı kullanılır"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <Label className="text-slate-700">SEO Açıklaması</Label>
                      <span className="text-slate-400 text-[10px]">
                        {form.seoDescription.length}/160
                      </span>
                    </div>
                    <Input
                      value={form.seoDescription}
                      maxLength={160}
                      onChange={(e) => set("seoDescription", e.target.value)}
                      placeholder="Arama motoru özet metni..."
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Yayın Durumu ve Kaydet */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => set("isPublished", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sayfayı Hemen Yayına Al</span>
                </label>

                <div className="flex items-center gap-2">
                  {form.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateNew}
                      className="rounded-xl text-xs"
                    >
                      Yeni Sayfaya Geç
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    disabled={pending || !form.title.trim()}
                    onClick={() =>
                      run(
                        () => savePageAction(form.id, form),
                        () => {
                          if (!form.id) setForm(blankPage);
                        },
                      )
                    }
                    className="rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                  >
                    {pending ? "Kaydediliyor..." : "Sayfayı Kaydet"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MENÜ BÖLÜMÜ                                 */
/* -------------------------------------------------------------------------- */

const QUICK_MENU_SUGGESTIONS = [
  { label: "Hakkımızda", url: "/sayfa/hakkimizda" },
  { label: "Sıkça Sorulan Sorular", url: "/sayfa/sikca-sorulan-sorular" },
  { label: "Kendi Turşunu Yap", url: "/kendi-tursunu-yap" },
  { label: "Sipariş Sorgulama", url: "/siparis-sorgula" },
  { label: "İletişim", url: "/iletisim" },
  { label: "Teslimat ve Kargo", url: "/sayfa/teslimat-ve-kargo" },
];

function MenuEditor({
  menuKey,
  title,
  description,
  initial,
}: {
  menuKey: "header" | "footer";
  title: string;
  description: string;
  initial: MenuItemRow[];
}) {
  const { pending, message, setMessage, run } = useRunner();
  const [items, setItems] = useState<MenuItemRow[]>(initial);

  function move(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const temp = next[index]!;
    next[index] = next[target]!;
    next[target] = temp;
    setItems(next);
  }

  function addSuggestion(suggestion: { label: string; url: string }) {
    if (items.some((i) => i.url === suggestion.url)) return;
    setItems((rows) => [...rows, suggestion]);
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {items.length} Öğe
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-6">
        <Notice message={message} onDismiss={() => setMessage(null)} />

        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Bu menüde henüz özel bağlantı yok. Aşağıdaki önerilerden veya &quot;Öğe Ekle&quot; butonundan ekleyebilirsiniz.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-xs"
              >
                {/* Sıralama Butonları */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, "up")}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    title="Yukarı Taşı"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, "down")}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    title="Aşağı Taşı"
                  >
                    ▼
                  </button>
                </div>

                {/* Etiket Input */}
                <Input
                  value={item.label}
                  placeholder="Bağlantı Başlığı"
                  aria-label="Bağlantı Başlığı"
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, label: e.target.value } : r,
                      ),
                    )
                  }
                  className="h-8 rounded-lg bg-white text-xs font-semibold"
                />

                {/* Adres Input */}
                <Input
                  value={item.url}
                  placeholder="/sayfa/..."
                  aria-label="Adres"
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, url: e.target.value } : r,
                      ),
                    )
                  }
                  className="h-8 rounded-lg bg-white text-xs font-mono"
                />

                {/* Sil Butonu */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setItems((rows) => rows.filter((_, i) => i !== index))
                  }
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Hızlı Öneri Hapları */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">
            Hızlı Ekle:
          </span>
          {QUICK_MENU_SUGGESTIONS.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => addSuggestion(s)}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              ＋ {s.label}
            </button>
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((rows) => [...rows, { label: "", url: "" }])
            }
            className="rounded-xl text-xs"
          >
            ＋ Yeni Boş Öğe Ekle
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => saveMenuAction({ key: menuKey, items }))}
            className="rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
          >
            {pending ? "Kaydediliyor..." : "Menüyü Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               ANA YÖNETİCİ                                 */
/* -------------------------------------------------------------------------- */

export function ContentManager({
  banners,
  pages,
  headerMenu,
  footerMenu,
}: {
  banners: BannerRow[];
  pages: PageRow[];
  headerMenu: MenuItemRow[];
  footerMenu: MenuItemRow[];
}) {
  const [activeTab, setActiveTab] = useState<"banners" | "pages" | "menus">("banners");

  return (
    <div className="flex flex-col gap-6">
      {/* Üst Sekmeler */}
      <div className="flex items-center border-b border-slate-200/80 bg-white px-4 rounded-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 border-b-2 py-4 px-4 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "banners"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🖼️ Vitrin Bannerları</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {banners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`flex items-center gap-2 border-b-2 py-4 px-4 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "pages"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📄 Statik & Kurumsal Sayfalar</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {pages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("menus")}
          className={`flex items-center gap-2 border-b-2 py-4 px-4 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "menus"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🧭 Menü & Navigasyon</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {headerMenu.length + footerMenu.length}
          </span>
        </button>
      </div>

      {/* Aktif Sekme İçeriği */}
      {activeTab === "banners" && <BannerSection banners={banners} />}
      {activeTab === "pages" && <PageSection pages={pages} />}
      {activeTab === "menus" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MenuEditor
            menuKey="header"
            title="Üst Menü (Header) Bağlantıları"
            description="Kullanıcıların sitenin üst gezinme çubuğunda göreceği ek linkler."
            initial={headerMenu}
          />
          <MenuEditor
            menuKey="footer"
            title="Alt Menü (Footer) Bağlantıları"
            description="Sitenin en altındaki Yardım ve Kurumsal sütununda listelenecek linkler."
            initial={footerMenu}
          />
        </div>
      )}
    </div>
  );
}
