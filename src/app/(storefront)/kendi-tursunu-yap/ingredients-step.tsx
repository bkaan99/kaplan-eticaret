"use client";

import Image from "next/image";
import { useState } from "react";
import {
  formatSeasonRange,
  INGREDIENT_GROUP_LABELS,
  type IngredientGroup,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { launchFlyToBidon } from "./fly-to-bidon";
import { Step } from "./builder-step-frame";

export type GroupFilter = "ALL" | IngredientGroup;

export function IngredientsStep({
  builder,
}: {
  builder: CustomPickleBuilderState;
}) {
  const { selected, full, groups, currency, maxIngredients, toggle, size } =
    builder;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GroupFilter>("ALL");

  // Sebzeler önce: karışımın ana malzemeleri ilk görünsün.
  const orderedGroups = [...groups].sort(
    ([a], [b]) => Number(b === "VEGETABLE") - Number(a === "VEGETABLE"),
  );
  const term = query.trim().toLocaleLowerCase("tr-TR");
  const items = orderedGroups
    .filter(([group]) => filter === "ALL" || group === filter)
    .flatMap(([, list]) => list)
    .filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(term));

  const filters: { key: GroupFilter; label: string }[] = [
    { key: "ALL", label: "Hepsi" },
    ...orderedGroups.map(([group]) => ({
      key: group,
      label: INGREDIENT_GROUP_LABELS[group],
    })),
  ];

  return (
    <Step
      id="adim-malzeme"
      index={2}
      title="Malzemeleri seçin"
      hint={
        <span className={full ? "font-semibold text-brand-pepper" : ""}>
          {selected.length}/{maxIngredients}
        </span>
      }
    >
      <p className="-mt-2 text-sm text-slate-600">
        {size?.label ?? "Bu bidon"} için en fazla {maxIngredients} malzeme. En
        az bir sebze seçin.
      </p>
      <label htmlFor="pickle-search" className="sr-only">
        Malzeme ara
      </label>
      <input
        id="pickle-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Malzeme ara: salatalık, biber…"
        className="h-11 w-full rounded-full border border-slate-200 bg-[#f4f5f0] px-5 text-sm font-medium outline-none focus:border-primary focus:bg-white"
      />
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
              filter === item.key
                ? "bg-primary text-white"
                : "border border-slate-200 text-primary hover:border-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Aramanıza uygun malzeme yok.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const active = selected.includes(item.id);
          const disabled = (!active && full) || !item.isAvailable;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={(event) => {
                // Eklerken karttan bidona uçuş; çıkarırken sadece toggle.
                if (!active && !disabled) {
                  const thumb =
                    event.currentTarget.querySelector<HTMLElement>(
                      "[data-fly-thumb]",
                    ) ?? event.currentTarget;
                  const rect = thumb.getBoundingClientRect();
                  launchFlyToBidon({
                    imageUrl: item.imageUrl ?? "/placeholder.svg",
                    from: {
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                    },
                  });
                }
                toggle(item.id);
              }}
              className={`group flex flex-col rounded-2xl border p-2 text-left transition-colors ${
                !item.isAvailable
                  ? "border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed"
                  : active
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-primary/50"
              }`}
            >
              <span className="relative flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-[#f4f5f0]">
                {!item.inStock ? (
                  <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Tükendi
                  </span>
                ) : !item.inSeason ? (
                  <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Mevsim Dışı
                  </span>
                ) : null}
                <span data-fly-thumb className="relative h-16 w-16">
                  <Image
                    src={item.imageUrl ?? "/placeholder.svg"}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain transition-transform group-hover:scale-110"
                  />
                </span>
              </span>
              <span className="mt-2 px-1 text-sm leading-tight font-bold text-primary">
                {item.name}
              </span>
              <div className="mt-0.5 flex flex-col gap-0.5 px-1">
                <span className="text-xs text-slate-500">
                  {formatMoney(item.pricePerKg, currency)} / kg
                </span>
                {item.seasonStartMonth && item.seasonEndMonth ? (
                  <span className="text-[11px] text-emerald-700/80">
                    Mevsim:{" "}
                    {formatSeasonRange(
                      item.seasonStartMonth,
                      item.seasonEndMonth,
                    )}
                  </span>
                ) : null}
              </div>
              <span
                className={`mt-2 rounded-full py-1.5 text-center text-xs font-bold ${
                  !item.inStock
                    ? "bg-slate-200 text-slate-600"
                    : !item.inSeason
                      ? "bg-amber-100 text-amber-800"
                      : active
                        ? "bg-primary text-white"
                        : "border border-primary text-primary"
                }`}
              >
                {!item.inStock
                  ? "Tükendi"
                  : !item.inSeason
                    ? "Mevsim Dışı"
                    : active
                      ? "Eklendi ✓"
                      : "+ Bidona ekle"}
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}
