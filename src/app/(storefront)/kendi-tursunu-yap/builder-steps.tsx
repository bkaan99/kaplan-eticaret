"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/components/motion/motion";
import {
  BRINE_OPTIONS,
  INGREDIENT_GROUP_LABELS,
  MAX_INGREDIENTS,
  MAX_NOTE_LENGTH,
  SPICE_OPTIONS,
  type BrineOption,
  type SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { formatMoney } from "@/shared/money";
import {
  extraFor,
  type CustomPickleBuilderState,
} from "./use-custom-pickle-builder";

const BRINE_TEXT: Record<BrineOption, string> = {
  VINEGAR: "Üzüm sirkesiyle klasik, kıtır ve ekşi.",
  NATURAL: "Sirkesiz, tuzlu suda kendi kendine mayalanır.",
};

const SPICE_PEPPERS: Record<SpiceOption, number> = {
  MILD: 0,
  MEDIUM: 1,
  HOT: 3,
};

export function Step({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-2xl font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {index}
          </span>
          {title}
        </h2>
        {hint ? (
          <span className="text-sm text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </motion.section>
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

export function SizeStep({
  sizes,
  builder,
}: {
  sizes: BuilderSize[];
  builder: CustomPickleBuilderState;
}) {
  const { variantId, setVariantId, setMessage } = builder;

  return (
    <Step index={1} title="Bidon boyutu">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sizes.map((item) => {
          const active = item.variantId === variantId;
          return (
            <button
              key={item.variantId}
              type="button"
              aria-pressed={active}
              disabled={!item.inStock}
              onClick={() => {
                setVariantId(item.variantId);
                setMessage(null);
              }}
              className="relative flex flex-col items-start gap-1 rounded-2xl border-2 border-border bg-white p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-40"
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
              <span className="relative font-display text-xl font-semibold">
                {item.label}
              </span>
              <span className="relative text-sm text-muted-foreground">
                {item.inStock
                  ? formatMoney(item.price, item.currency)
                  : "Tükendi"}
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}

export function IngredientsStep({
  builder,
}: {
  builder: CustomPickleBuilderState;
}) {
  const { selected, full, groups, size, currency, toggle } = builder;

  return (
    <Step
      index={2}
      title="Malzemeler"
      hint={
        <span className={full ? "font-semibold text-brand-pepper" : ""}>
          {selected.length}/{MAX_INGREDIENTS} seçildi
        </span>
      }
    >
      <p className="-mt-2 text-sm text-muted-foreground">
        En az bir sebze seçin. Fiyatlar seçtiğiniz bidon boyutuna göre
        hesaplanır.
      </p>
      {groups.map(([group, items]) => (
        <div key={group} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-[0.2em] text-brand-leaf uppercase">
            {INGREDIENT_GROUP_LABELS[group]}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const active = selected.includes(item.id);
              const disabled = !active && full;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => toggle(item.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center transition-colors disabled:opacity-40 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <AnimatePresence>
                    {active ? (
                      <motion.span
                        aria-hidden="true"
                        className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 20,
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12.5 10 17 19 7" />
                        </svg>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <motion.span
                    className="relative h-14 w-14"
                    animate={
                      active ? { rotate: [0, -12, 10, 0] } : { rotate: 0 }
                    }
                    transition={{ duration: 0.5 }}
                  >
                    <Image
                      src={item.imageUrl ?? "/placeholder.svg"}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain transition-transform group-hover:scale-110"
                    />
                  </motion.span>
                  <span className="text-sm leading-tight font-semibold">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    +{formatMoney(extraFor(item, size), currency)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </Step>
  );
}

export function BrineStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { brine, setBrine, brines } = builder;

  return (
    <Step index={3} title="Salamura">
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
    <Step index={4} title="Acılık">
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
    <Step index={5} title="Notunuz" hint="İsteğe bağlı">
      <label htmlFor="pickle-note" className="sr-only">
        Not
      </label>
      <textarea
        id="pickle-note"
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Örneğin: sarımsak bol olsun, havuçlar ince doğransın…"
        className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      <span className="-mt-2 self-end text-xs text-muted-foreground">
        {note.length}/{MAX_NOTE_LENGTH}
      </span>
    </Step>
  );
}
