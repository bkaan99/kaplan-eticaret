"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import {
  INGREDIENT_GROUP_LABELS,
  maxIngredientsForSize,
  MAX_NOTE_LENGTH,
  type IngredientGroup,
} from "@/modules/custom-pickle/custom-pickle.types";
import { SHARE_STEP } from "@/modules/custom-pickle/custom-pickle.shares";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { formatMoney } from "@/shared/money";
import type { CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { launchFlyToBidon } from "./fly-to-bidon";

export function Step({
  id,
  index,
  title,
  hint,
  children,
}: {
  id?: string;
  index: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex scroll-mt-44 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-xl font-bold text-primary sm:text-2xl">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-storefront text-sm font-bold text-white">
            {index}
          </span>
          {title}
        </h2>
        {hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function PepperIcons({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className={index < count ? "text-brand-pepper" : "text-border"}
        >
          <path
            fill="currentColor"
            d="M9 4c-1.5 4-1 9 3 16 2.5-5 3.5-10 2-16z"
          />
          <path
            d="M11 4c0-1.5 1-2.5 3-3"
            stroke="#2f5233"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </span>
  );
}

function SizeThumb({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 48 58"
      className={`h-12 w-10 shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-70"}`}
      aria-hidden="true"
    >
      <ellipse cx="24" cy="54" rx="16" ry="2.5" fill="#0b2318" opacity="0.12" />
      <path
        d="M15 16 C11 17 9 21 8 27 C7 35 7 42 9 47 C11 51 15 53 19 53 H29 C33 53 37 51 39 47 C41 42 41 35 40 27 C39 21 37 17 33 16 Z"
        fill="#f4f7f0"
        stroke="#8fa07a"
        strokeWidth="1.4"
      />
      <rect x="15" y="6" width="18" height="11" rx="2.5" fill="#f0c800" />
      <rect x="17" y="4" width="14" height="3" rx="1" fill="#ffe566" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={17.5 + i * 3.4}
          y="10"
          width="1.5"
          height="5"
          rx="0.5"
          fill="#b89600"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

export function SizeStep({
  sizes,
  builder,
}: {
  sizes: BuilderSize[];
  builder: CustomPickleBuilderState;
}) {
  const { variantId, selectSize, maxIngredients } = builder;

  return (
    <Step index={1} title="Bidon boyutu">
      <p className="-mt-2 text-sm text-muted-foreground">
        Seçili boyutta en fazla {maxIngredients} malzeme ekleyebilirsiniz.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {sizes.map((item) => {
          const active = item.variantId === variantId;
          const itemMax = maxIngredientsForSize(item.weightGram);
          return (
            <button
              key={item.variantId}
              type="button"
              aria-pressed={active}
              disabled={!item.inStock}
              onClick={() => selectSize(item.variantId)}
              className="relative flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-3 text-center transition-colors hover:border-primary/40 disabled:opacity-40 sm:p-4"
            >
              {active ? (
                <motion.span
                  layoutId="size-highlight"
                  aria-hidden="true"
                  className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              ) : null}
              <span className="relative">
                <SizeThumb active={active} />
              </span>
              <span className="relative flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-bold text-primary sm:text-base">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-foreground/80">
                  {item.inStock
                    ? formatMoney(item.price, item.currency)
                    : "Tükendi"}
                </span>
                <span className="text-xs text-muted-foreground">
                  En fazla {itemMax} malzeme
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}

type GroupFilter = "ALL" | IngredientGroup;

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
          const disabled = !active && full;
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
              className={`group flex flex-col rounded-2xl border p-2 text-left transition-colors disabled:opacity-40 ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-primary/50"
              }`}
            >
              <span className="relative flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-[#f4f5f0]">
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
              <span className="mt-0.5 px-1 text-xs text-slate-500">
                {formatMoney(item.pricePerKg, currency)} / kg
              </span>
              <span
                className={`mt-2 rounded-full py-1.5 text-center text-xs font-bold ${
                  active
                    ? "bg-primary text-white"
                    : "border border-primary text-primary"
                }`}
              >
                {active ? "Eklendi ✓" : "+ Bidona ekle"}
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}

export function RatioStep({ builder }: { builder: CustomPickleBuilderState }) {
  const {
    vegetables,
    shares,
    filled,
    isFull,
    changeShare,
    balanceShares,
    toggle,
    size,
  } = builder;
  const kg = size?.weightGram ? size.weightGram / 1000 : 1;

  return (
    <Step id="adim-oran" index={3} title="Oranları ayarlayın">
      <p className="-mt-2 text-sm text-slate-600">
        Her adım %{SHARE_STEP}. Bidon doluyken birini artırınca en büyük paydan
        düşülür.
      </p>
      {vegetables.length === 0 ? (
        <p className="rounded-xl bg-[#f4f5f0] px-4 py-5 text-center text-sm text-slate-500">
          Sebze seçtiğinizde oranlar burada görünür.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {vegetables.map((item) => {
              const share = shares[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2"
                >
                  <Image
                    src={item.imageUrl ?? "/placeholder.svg"}
                    alt=""
                    width={36}
                    height={36}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-primary">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatGrams((kg * share) / 100)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`${item.name} oranını azalt`}
                      disabled={share <= SHARE_STEP}
                      onClick={() => changeShare(item.id, -1)}
                      className="h-8 w-8 rounded-full border border-slate-200 text-primary disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-primary tabular-nums">
                      %{share}
                    </span>
                    <button
                      type="button"
                      aria-label={`${item.name} oranını artır`}
                      onClick={() => changeShare(item.id, 1)}
                      className="h-8 w-8 rounded-full border border-slate-200 text-primary"
                    >
                      +
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label={`${item.name} malzemesini çıkar`}
                    onClick={() => toggle(item.id)}
                    className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:text-brand-pepper"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-bold ${isFull ? "text-primary" : "text-brand-pepper"}`}
            >
              {isFull ? "Bidon dolu" : `Bidon %${filled} dolu`}
            </span>
            <button
              type="button"
              onClick={balanceShares}
              className="rounded-full border border-primary px-4 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Eşit dağıt
            </button>
          </div>
        </>
      )}
    </Step>
  );
}

function formatGrams(kg: number) {
  return kg >= 1
    ? `${kg.toLocaleString("tr-TR")} kg`
    : `${Math.round(kg * 1000)} g`;
}

export function BrineStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { brine, setBrine, brines } = builder;

  return (
    <Step index={4} title="Salamura">
      <div className="grid gap-3 sm:grid-cols-2">
        {brines.map((item) => {
          const active = brine === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setBrine(item.key)}
              className="relative flex flex-col items-start gap-1 rounded-2xl border-2 border-border bg-white p-4 text-left transition-colors hover:border-primary/40"
            >
              {active ? (
                <motion.span
                  layoutId="brine-highlight"
                  aria-hidden="true"
                  className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              ) : null}
              <span className="relative flex items-center gap-2 font-semibold">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span className="relative text-sm text-muted-foreground">
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}

export function SpiceStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { spice, setSpice, spices } = builder;

  return (
    <Step index={5} title="Acılık">
      <div
        className="grid gap-2 rounded-full border border-border bg-white p-1.5"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, spices.length)}, minmax(0, 1fr))`,
        }}
      >
        {spices.map((item) => {
          const active = spice === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSpice(item.key)}
              className={`relative flex flex-col items-center gap-1 rounded-full px-2 py-2.5 text-sm font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-2 ${active ? "text-primary-foreground" : "text-foreground/80"}`}
            >
              {active ? (
                <motion.span
                  layoutId="spice-highlight"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              ) : null}
              <span className="relative">{item.label}</span>
              <span className="relative">
                <PepperIcons count={item.peppers} />
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}

export function NoteStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { note, setNote } = builder;

  return (
    <Step index={6} title="Notunuz" hint="İsteğe bağlı">
      <label htmlFor="pickle-note" className="sr-only">
        Not
      </label>
      <textarea
        id="pickle-note"
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      <span className="-mt-2 self-end text-xs text-muted-foreground">
        {note.length}/{MAX_NOTE_LENGTH}
      </span>
    </Step>
  );
}
