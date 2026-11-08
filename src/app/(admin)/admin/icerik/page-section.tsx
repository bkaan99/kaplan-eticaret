"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import Link from "next/link";
import { useRef, useState } from "react";
import { RichText } from "@/components/content/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/shared/slug";
import { deletePageAction, savePageAction } from "./actions";
import { type PageRow } from "./content-types";
import { Notice } from "./content-ui";

export const blankPage = {
  id: null as string | null,
  title: "",
  slug: "",
  content: "",
  isPublished: true,
  seoTitle: "",
  seoDescription: "",
};

export function PageSection({ pages }: { pages: PageRow[] }) {
  const { pending, message, setMessage, run } = useActionRunner();
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
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">
              🔍
            </span>
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
                    <Badge
                      tone={page.isPublished ? "success" : "warning"}
                      className="shrink-0"
                    >
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
                          if (
                            window.confirm(
                              `"${page.title}" sayfası silinsin mi?`,
                            )
                          ) {
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
                  {form.id
                    ? `Sayfayı Düzenle: ${form.title}`
                    : "Yeni Sayfa Oluştur"}
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
                  <Label className="font-semibold text-slate-800">
                    Sayfa Başlığı
                  </Label>
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
                  <Label className="font-semibold text-slate-800">
                    Sayfa Adresi (Slug)
                  </Label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                    <span className="text-xs text-slate-400 font-mono">
                      /sayfa/
                    </span>
                    <input
                      value={form.slug}
                      onChange={(e) => set("slug", slugify(e.target.value))}
                      placeholder="hakkimizda"
                      className="h-9 w-full bg-transparent pl-1 text-xs font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Düzenleme Alanı veya Önizleme */}
              {tabMode === "edit" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-semibold text-slate-800">
                      Sayfa İçeriği
                    </Label>
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
                    💡 İpucu: Güvenlik için HTML etiketleri yerine Markdown
                    kullanın. Boş satır bırakarak yeni paragraflar
                    oluşturabilirsiniz.
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
                    <p className="text-sm text-slate-400 italic">
                      İçerik henüz girilmedi.
                    </p>
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
                      <span className="text-slate-400 text-[10px]">
                        {form.seoTitle.length}/70
                      </span>
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
