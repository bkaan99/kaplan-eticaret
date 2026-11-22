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
import { tasteTags } from "./flavor-profile";
import { PICKLE_PRESETS } from "./pickle-presets";
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
      done={builder.hasVegetable}
      hint={
        <span className={full ? "font-semibold text-brand-pepper" : ""}>
          {selected.length}/{maxIngredients}
        </span>
      }
    >
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-slate-600">
          {size?.label ?? "Bu bidon"} için en fazla {maxIngredients} malzeme. En
          az bir sebze seçin.
        </p>
        {/* Kontenjan: seçilen malzeme kadar kavanoz dolar */}
        <div
          role="img"
          aria-label={`${selected.length} / ${maxIngredients} malzeme seçildi`}
          className="flex items-center gap-1"
        >
          {Array.from({ length: maxIngredients }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`h-5 w-3.5 rounded-[4px] border transition-colors duration-200 ${
                index < selected.length
                  ? "border-primary bg-primary"
                  : "border-slate-300 bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Kararsız kullanıcı için tek dokunuşluk başlangıç */}
      {selected.length === 0 && PICKLE_PRESETS[0] ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-primary">Kararsız mısın?</p>
            <p className="text-xs text-slate-600">
              Ustanın klasik karışımıyla başla, sonra istediğin gibi değiştir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => builder.applyPreset(PICKLE_PRESETS[0]!)}
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Ustanın karışımı
          </button>
        </div>
      ) : null}
      <label htmlFor="pickle-search" className="sr-only">
        Malzeme ara
      </label>
      <input
        id="pickle-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Malzeme ara: salatalık, biber…"
        className="h-11 w-full rounded-full border border-slate-200 bg-[#f4f5f0] px-5 text-sm font-medium outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
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
          const status = !item.inStock
            ? { text: "Tükendi", tone: "bg-rose-50 text-rose-700" }
            : !item.inSeason
              ? { text: "Mevsim dışı", tone: "bg-amber-50 text-amber-800" }
              : null;
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
              className={`group relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 pt-4 pb-3 text-center transition-all duration-200 ${
                !item.isAvailable
                  ? "cursor-not-allowed border-slate-200 bg-slate-50/70 opacity-60"
                  : active
                    ? "border-primary bg-primary/5 shadow-[0_8px_20px_-12px_rgba(21,71,52,0.55)]"
                    : disabled
                      ? "cursor-not-allowed border-slate-200 opacity-50"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_24px_-14px_rgba(11,35,24,0.35)]"
              }`}
            >
              {/* Seçim göstergesi */}
              {item.isAvailable ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "border border-slate-300 text-slate-400 group-hover:border-primary group-hover:text-primary"
                  }`}
                >
                  {active ? (
                    <svg
                      viewBox="0 0 20 20"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  ) : (
                    "+"
                  )}
                </span>
              ) : null}

              <span
                data-fly-thumb
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-white" : "bg-[#f4f5f0]"
                }`}
              >
                <Image
                  src={item.imageUrl ?? "/placeholder.svg"}
                  alt=""
                  width={72}
                  height={72}
                  className="h-[4.5rem] w-[4.5rem] object-contain transition-transform duration-200 group-hover:scale-110"
                />
              </span>

              <span className="mt-1 text-sm leading-tight font-bold text-primary">
                {item.name}
              </span>
              {tasteTags(item).length > 0 ? (
                <span className="text-[11px] font-semibold text-brand-leaf">
                  {tasteTags(item).join(" · ")}
                </span>
              ) : null}
              <span className="text-xs font-medium text-slate-500">
                {formatMoney(item.pricePerKg, currency)} / kg
              </span>

              {status ? (
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.tone}`}
                >
                  {status.text}
                </span>
              ) : item.seasonStartMonth && item.seasonEndMonth ? (
                <span className="mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {formatSeasonRange(
                    item.seasonStartMonth,
                    item.seasonEndMonth,
                  )}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Step>
  );
}
