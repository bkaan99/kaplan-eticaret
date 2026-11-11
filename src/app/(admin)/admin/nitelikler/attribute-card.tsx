"use client";

import { useActionRunner } from "@/components/admin/use-action-runner";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/cn";
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
  const linkedProducts = attribute.values.reduce(
    (sum, value) => sum + value.productCount,
    0,
  );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition hover:border-slate-300">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-slate-900">
              {attribute.name}
            </h3>
            {attribute.isFilterable ? (
              <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-800 uppercase">
                Vitrin filtresi
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Yalnızca ürün
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-slate-500">
            {attribute.values.length} değer
            {linkedProducts > 0 ? ` · ${linkedProducts} ürün bağlantısı` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => onEdit(attribute)}>
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || inUse}
            onClick={() => {
              if (
                window.confirm(
                  `“${attribute.name}” niteliği ve tüm değerleri silinsin mi?`,
                )
              ) {
                run(() => deleteAttributeAction(attribute.id));
              }
            }}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            title={
              inUse ? "Ürünlerde kullanılan nitelik silinemez" : "Niteliği sil"
            }
          >
            Sil
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Değerler
          </p>
          <Button size="sm" variant="outline" onClick={() => onAddValue(attribute)}>
            Değer ekle
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {attribute.values.map((item) => (
            <span
              key={item.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-medium text-slate-800",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  onEditValue(attribute, { id: item.id, value: item.value })
                }
                className="hover:text-emerald-800"
                title="Değeri düzenle"
              >
                {item.value}
              </button>
              <span className="rounded bg-white px-1 text-[10px] font-semibold text-slate-500 tabular-nums">
                {item.productCount}
              </span>
              <button
                type="button"
                aria-label={`${item.value} değerini sil`}
                disabled={pending || item.productCount > 0}
                onClick={() => run(() => deleteAttributeValueAction(item.id))}
                className="text-slate-400 hover:text-red-600 disabled:opacity-40"
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

          {attribute.values.length === 0 ? (
            <p className="text-[12px] text-slate-400">
              Henüz değer yok. “Değer ekle” ile seçenek tanımlayın.
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-[12px] font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
