"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteBannerAction, saveBannerAction } from "./actions";
import { type BannerRow } from "./content-types";
import { Notice, toLocalInput } from "./content-ui";

export type BannerFormState = {
  id: string | null;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export const blankBanner: BannerFormState = {
  id: null,
  title: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export function BannerModal({
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
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
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
            <Label className="font-semibold text-slate-800">
              Banner Başlığı
            </Label>
            <Input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Örn: Yeni Hasat Çubuk Turşuları Çıktı!"
              className="rounded-xl"
            />
          </div>

          {/* Görsel Adresi & Dosya Yükleme */}
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-slate-800">
              Banner Görseli
            </Label>
            <div className="flex gap-2">
              <Input
                value={form.imageUrl}
                onChange={(e) => onChange("imageUrl", e.target.value)}
                placeholder="/images/banner/... veya dosya yükleyin"
                className="rounded-xl flex-1 font-mono text-xs"
              />
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition">
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
              <Label className="font-semibold text-slate-800">
                Tıklama Bağlantısı
              </Label>
              <span className="text-[11px] text-slate-400">İsteğe bağlı</span>
            </div>
            <Input
              value={form.linkUrl}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              placeholder="/kategori/klasik-tursular veya /kendi-tursunu-yap"
              className="rounded-xl font-mono text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["/kategori/klasik-tursular", "/kendi-tursunu-yap", "/ara"].map(
                (sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => onChange("linkUrl", sample)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    {sample}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Sıra */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">
                Gösterim Sırası
              </Label>
              <Input
                value={form.sortOrder}
                onChange={(e) => onChange("sortOrder", e.target.value)}
                inputMode="numeric"
                className="rounded-xl"
              />
            </div>
            {/* Başlangıç Tarihi */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">
                Yayın Başlangıcı
              </Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => onChange("startsAt", e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            {/* Bitiş Tarihi */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-slate-800">
                Yayın Bitişi
              </Label>
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
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.title.trim()}
            onClick={onSave}
            className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {pending
              ? "Kaydediliyor..."
              : form.id
                ? "Değişiklikleri Kaydet"
                : "Bannerı Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BannerSection({ banners }: { banners: BannerRow[] }) {
  const { pending, message, setMessage, run } = useActionRunner();
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
          <h2 className="text-base font-bold text-slate-900">
            Ana Sayfa Bannerları
          </h2>
          <p className="text-xs text-slate-500">
            Vitrin sliderında dönecek görselleri, kampanya afişlerini ve
            yönlendirmeleri yönetin.
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

      <Notice
        message={!open ? message : null}
        onDismiss={() => setMessage(null)}
      />

      {banners.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400 mb-3">
            🖼️
          </div>
          <p className="font-semibold text-slate-800">
            Henüz banner eklenmemiş
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ana sayfa vitrininde öne çıkarmak istediğiniz kampanya ve görseller
            için yukarıdaki butonu kullanın.
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
                  <h3
                    className="font-bold text-slate-900 truncate"
                    title={banner.title}
                  >
                    {banner.title}
                  </h3>
                  {banner.linkUrl ? (
                    <p
                      className="mt-0.5 truncate text-xs text-slate-500 font-mono"
                      title={banner.linkUrl}
                    >
                      🔗 {banner.linkUrl}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Bağlantı atanmamış
                    </p>
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
                      if (
                        window.confirm(`"${banner.title}" bannerı silinsin mi?`)
                      ) {
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
