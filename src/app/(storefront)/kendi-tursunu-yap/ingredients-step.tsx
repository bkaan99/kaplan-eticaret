"use client";

import Image from "next/image";
import { useState } from "react";
import {
  formatSeasonRange,
  isMonthInSeason,
  INGREDIENT_GROUP_LABELS,
  type IngredientGroup,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { launchFlyToBidon } from "./fly-to-bidon";
import { tasteTags } from "./flavor-profile";
import { PICKLE_PRESETS } from "./pickle-presets";
import { getPickleSprite } from "./pickle-sprites";
import { Step } from "./builder-step-frame";

/** 12 aylık hasat takvimi: mevsimindeki aylar yeşil, bu ay halkalı. */
function HarvestCalendar({
  start,
  end,
}: {
  start: number | null;
  end: number | null;
}) {
  const current = new Date().getMonth() + 1;
  const label = `Hasat: ${formatSeasonRange(start, end)}`;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="mt-1 flex items-center gap-[3px]"
    >
      {Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const inSeason = isMonthInSeason(start, end, month);
        return (
          <span
            key={month}
            className={`h-2 w-2 rounded-[3px] ${
              inSeason ? "bg-brand-leaf" : "bg-slate-200"
            } ${month === current ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
          />
        );
      })}
    </span>
  );
}

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
      title="Bahçeden topla"
      done={builder.hasVegetable}
      hint={
        <span className={full ? "font-semibold text-brand-pepper" : ""}>
          {selected.length}/{maxIngredients}
        </span>
      }
    >
      <p className="-mt-2 text-sm text-slate-600">
        {size?.label ?? "Bu bidon"} için en fazla {maxIngredients} malzeme. En
        az bir sebze seçin.
        {selected.length === 0 && PICKLE_PRESETS[0] ? (
          <>
            {" "}
            <button
              type="button"
              onClick={() => builder.applyPreset(PICKLE_PRESETS[0]!)}
              className="font-semibold text-brand-leaf underline decoration-dotted underline-offset-4 hover:text-primary"
            >
              Karar veremediysen ustaya bırak
            </button>
          </>
        ) : null}
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
                  const sprite = getPickleSprite(item.slug || item.id, 0);
                  launchFlyToBidon({
                    imageUrl: sprite.url,
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
                className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl p-1 transition-all duration-200 ${
                  active
                    ? "bg-white shadow-[0_4px_16px_-4px_rgba(21,71,52,0.2)] ring-2 ring-primary"
                    : "bg-[#f4f5f0] group-hover:bg-white group-hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]"
                }`}
              >
                <Image
                  src={item.imageUrl ?? "/placeholder.svg"}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
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
              ) : (
                <HarvestCalendar
                  start={item.seasonStartMonth}
                  end={item.seasonEndMonth}
                />
              )}
            </button>
          );
        })}
      </div>
    </Step>
  );
}
