"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
          ? { text: "Kaydedildi", error: false }
          : { text: result.error ?? "İşlem başarısız", error: true },
      );
      if (result.ok) onDone?.();
    });
  }

  return { pending, message, run };
}

function Message({
  message,
}: {
  message: { text: string; error: boolean } | null;
}) {
  if (!message) return null;
  return (
    <p
      role={message.error ? "alert" : "status"}
      className={
        message.error ? "text-sm text-red-600" : "text-sm text-green-700"
      }
    >
      {message.text}
    </p>
  );
}

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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    const firstField = dialogRef.current?.querySelector<HTMLElement>(
      "input:not([type=checkbox]), textarea, select",
    );
    firstField?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-bold text-slate-900">
            {form.id ? "Banner düzenle" : "Yeni banner"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-1">
            <Label>Başlık</Label>
            <Input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Görsel adresi</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => onChange("imageUrl", e.target.value)}
              placeholder="https://… veya /yol"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Bağlantı (isteğe bağlı)</Label>
            <Input
              value={form.linkUrl}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              placeholder="/kategori/giyim"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Sıra</Label>
            <Input
              value={form.sortOrder}
              onChange={(e) => onChange("sortOrder", e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label>Yayın başlangıcı</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => onChange("startsAt", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Yayın bitişi</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => onChange("endsAt", e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
            />
            Aktif
          </label>
          <Message message={message} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="button" disabled={pending} onClick={onSave}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BannerSection({ banners }: { banners: BannerRow[] }) {
  const { pending, message, run } = useRunner();
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
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Ana sayfa bannerları</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Vitrin sliderında gösterilecek görselleri yönetin.
            </p>
          </div>
          <Button type="button" onClick={openCreate}>
            Yeni banner
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-slate-100 text-sm">
            {banners.map((banner) => (
              <li
                key={banner.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {banner.title}
                    </span>
                    {!banner.isActive ? (
                      <Badge tone="warning">Pasif</Badge>
                    ) : (
                      <Badge tone="success">Aktif</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    Sıra {banner.sortOrder}
                    {banner.linkUrl ? ` · ${banner.linkUrl}` : ""}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(banner)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm("Banner silinsin mi?"))
                        run(() => deleteBannerAction(banner.id));
                    }}
                  >
                    Sil
                  </Button>
                </div>
              </li>
            ))}
            {banners.length === 0 ? (
              <li className="py-10 text-center text-slate-500">
                Henüz banner yok. Yeni eklemek için yukarıdaki butonu kullanın.
              </li>
            ) : null}
          </ul>
          <Message message={!open ? message : null} />
        </CardContent>
      </Card>

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
    </>
  );
}

function PageSection({ pages }: { pages: PageRow[] }) {
  const { pending, message, run } = useRunner();
  const blank = {
    id: null as string | null,
    title: "",
    slug: "",
    content: "",
    isPublished: false,
    seoTitle: "",
    seoDescription: "",
  };
  const [form, setForm] = useState(blank);
  const set = <K extends keyof typeof blank>(
    key: K,
    value: (typeof blank)[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Sayfalar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {pages.map((page) => (
              <li
                key={page.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{page.title}</span>
                  <span className="text-xs text-muted-foreground">
                    /sayfa/{page.slug}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge tone={page.isPublished ? "success" : "warning"}>
                    {page.isPublished ? "Yayında" : "Taslak"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        id: page.id,
                        title: page.title,
                        slug: page.slug,
                        content: page.content,
                        isPublished: page.isPublished,
                        seoTitle: page.seoTitle ?? "",
                        seoDescription: page.seoDescription ?? "",
                      })
                    }
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`"${page.title}" silinsin mi?`))
                        run(() => deletePageAction(page.id));
                    }}
                  >
                    Sil
                  </Button>
                </div>
              </li>
            ))}
            {pages.length === 0 ? (
              <li className="py-4 text-muted-foreground">Sayfa yok.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Sayfayı düzenle" : "Yeni sayfa"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label>Başlık</Label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Adres (slug)</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="Boşsa başlıktan üretilir"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>İçerik</Label>
            <Textarea
              rows={14}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              # Başlık, ## Alt başlık, - liste, **kalın**, [metin](/adres) ve
              boş satırla paragraf kullanabilirsiniz. HTML desteklenmez.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label>SEO başlığı</Label>
              <Input
                value={form.seoTitle}
                maxLength={70}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>SEO açıklaması</Label>
              <Input
                value={form.seoDescription}
                maxLength={160}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
            />
            Yayında
          </label>
          <div className="flex gap-2">
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () => savePageAction(form.id, form),
                  () => !form.id && setForm(blank),
                )
              }
            >
              Kaydet
            </Button>
            {form.id ? (
              <Button variant="outline" onClick={() => setForm(blank)}>
                Yeni sayfa
              </Button>
            ) : null}
          </div>
          <Message message={message} />
        </CardContent>
      </Card>
    </div>
  );
}

function MenuEditor({
  menuKey,
  title,
  initial,
}: {
  menuKey: "header" | "footer";
  title: string;
  initial: MenuItemRow[];
}) {
  const { pending, message, run } = useRunner();
  const [items, setItems] = useState<MenuItemRow[]>(initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              value={item.label}
              placeholder="Etiket"
              aria-label="Etiket"
              onChange={(e) =>
                setItems((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, label: e.target.value } : r,
                  ),
                )
              }
            />
            <Input
              value={item.url}
              placeholder="/sayfa/hakkimizda"
              aria-label="Adres"
              onChange={(e) =>
                setItems((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, url: e.target.value } : r,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              onClick={() =>
                setItems((rows) => rows.filter((_, i) => i !== index))
              }
            >
              Kaldır
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setItems((rows) => [...rows, { label: "", url: "" }])
            }
          >
            Öğe ekle
          </Button>
          <Button
            disabled={pending}
            onClick={() => run(() => saveMenuAction({ key: menuKey, items }))}
          >
            Kaydet
          </Button>
        </div>
        <Message message={message} />
      </CardContent>
    </Card>
  );
}

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
  return (
    <div className="flex flex-col gap-10">
      <BannerSection banners={banners} />
      <PageSection pages={pages} />
      <div className="grid gap-6 lg:grid-cols-2">
        <MenuEditor
          menuKey="header"
          title="Üst menü ek bağlantıları"
          initial={headerMenu}
        />
        <MenuEditor
          menuKey="footer"
          title="Alt menü (footer)"
          initial={footerMenu}
        />
      </div>
    </div>
  );
}
