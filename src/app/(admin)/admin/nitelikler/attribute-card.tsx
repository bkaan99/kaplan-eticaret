"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteAttributeAction, deleteAttributeValueAction } from "./actions";
import { type AttributeView } from "./attribute-types";

export function AttributeCard({
  attribute,
  onEdit,
  onAddValue,
  onEditValue,
}: {
  attribute: AttributeView;
  onEdit: (attribute: AttributeView) => void;
  onAddValue: (attribute: AttributeView) => void;
  onEditValue: (
    attribute: AttributeView,
    value: { id: string; value: string },
  ) => void;
}) {
  const { pending, error, run } = useActionRunner();
  const inUse = attribute.values.some((value) => value.productCount > 0);

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
            disabled={pending || inUse}
            onClick={() => {
              if (
                window.confirm(
                  `"${attribute.name}" niteliği ve tüm değerleri silinsin mi?`,
                )
              ) {
                run(() => deleteAttributeAction(attribute.id));
              }
            }}
            className="h-8 px-2.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer disabled:opacity-40"
            title={
              inUse ? "Ürünlerde kullanılan nitelik silinemez" : "Niteliği sil"
            }
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
                <button
                  type="button"
                  onClick={() =>
                    onEditValue(attribute, { id: item.id, value: item.value })
                  }
                  className="hover:text-emerald-800 cursor-pointer"
                  title="Değeri düzenle"
                >
                  {item.value}
                </button>
                <span className="rounded-md bg-white px-1.5 py-0.2 text-[10px] font-bold text-slate-500 border border-slate-200">
                  {item.productCount}
                </span>
                <button
                  type="button"
                  aria-label={`${item.value} değerini sil`}
                  disabled={pending || item.productCount > 0}
                  onClick={() => run(() => deleteAttributeValueAction(item.id))}
                  className="ml-0.5 text-slate-400 hover:text-red-600 transition cursor-pointer disabled:opacity-40"
                  title={
                    item.productCount > 0
                      ? "Ürünlerde kullanılan değer silinemez"
                      : "Değeri kaldır"
                  }
                >
                  ✕
                </button>
              </span>
            ))}

            {attribute.values.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Henüz değer tanımlanmadı. &ldquo;+ Değer Ekle&rdquo; ile
                ekleyebilirsiniz.
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
