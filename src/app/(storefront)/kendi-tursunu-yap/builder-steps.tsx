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
import { launchFlyToBidon } from "./fly-to-bidon";

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
      className="flex flex-col gap-4 border-t border-border/70 pt-8 first:border-t-0 first:pt-0"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-brand-dark">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-brand-cream">
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
  const { variantId, setVariantId, setMessage } = builder;

  return (
    <Step index={1} title="Bidon boyutu">
      <p className="-mt-2 text-sm text-muted-foreground">
        Boyutu seçin; malzemeler seçtiğiniz bidona göre fiyatlanır. En fazla{" "}
        {MAX_INGREDIENTS} malzeme ekleyebilirsiniz.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              className="relative flex items-center gap-3 rounded-2xl border-2 border-border bg-white p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-40 sm:flex-col sm:items-start sm:gap-2"
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
                <span className="font-display text-xl font-semibold text-brand-dark">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-foreground/80">
                  {item.inStock
                    ? formatMoney(item.price, item.currency)
                    : "Tükendi"}
                </span>
                <span className="text-xs text-muted-foreground">
                  En fazla {MAX_INGREDIENTS} malzeme
                </span>
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
                    data-fly-thumb
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
