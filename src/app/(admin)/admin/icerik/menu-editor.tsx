"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveMenuAction } from "./actions";
import { type MenuItemRow } from "./content-types";
import { Notice } from "./content-ui";

export const QUICK_MENU_SUGGESTIONS = [
  { label: "Hakkımızda", url: "/sayfa/hakkimizda" },
  { label: "Sıkça Sorulan Sorular", url: "/sayfa/sikca-sorulan-sorular" },
  { label: "Kendi Turşunu Yap", url: "/kendi-tursunu-yap" },
  { label: "Sipariş Sorgulama", url: "/siparis-sorgula" },
  { label: "İletişim", url: "/iletisim" },
  { label: "Teslimat ve Kargo", url: "/sayfa/teslimat-ve-kargo" },
];

export function MenuEditor({
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
  const { pending, message, setMessage, run } = useActionRunner();
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
            <CardTitle className="text-base font-bold text-slate-900">
              {title}
            </CardTitle>
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
            Bu menüde henüz özel bağlantı yok. Aşağıdaki önerilerden veya
            &quot;Öğe Ekle&quot; butonundan ekleyebilirsiniz.
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
