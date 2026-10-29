"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT } from "@/components/motion/motion";
import { BagIcon } from "@/components/storefront/icons";
import {
  BRINE_OPTIONS,
  SPICE_OPTIONS,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import {
  extraFor,
  type CustomPickleBuilderState,
} from "./use-custom-pickle-builder";

export function BuilderSummary({
  builder,
}: {
  builder: CustomPickleBuilderState;
}) {
  const {
    size,
    chosen,
    base,
    currency,
    unit,
    quantity,
    setQuantity,
    brine,
    spice,
    canAdd,
    hasVegetable,
    addToCart,
    justAdded,
    pending,
    message,
  } = builder;

  return (
    <section
      aria-label="Bidon özeti"
      className="flex flex-col gap-4 rounded-[2rem] bg-brand-dark p-6 text-brand-cream sm:p-8"
    >
      <h2 className="font-display text-2xl font-semibold">Bidonunuz</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>{size?.label ?? "Bidon"}</dt>
          <dd>{formatMoney(base, currency)}</dd>
        </div>
        <AnimatePresence initial={false}>
          {chosen.map((item) => (
            <motion.div
              key={item.id}
              className="flex justify-between gap-4 text-brand-cream/75"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <dt>{item.name}</dt>
              <dd>+{formatMoney(extraFor(item, size), currency)}</dd>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex justify-between gap-4 text-brand-cream/75">
          <dt>Salamura · acılık</dt>
          <dd>
            {builder.activeBrine?.label ?? BRINE_OPTIONS[brine] ?? brine} ·{" "}
            {builder.activeSpice?.label ?? SPICE_OPTIONS[spice] ?? spice}
          </dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-white/15 pt-3">
          <dt className="font-semibold">Bidon fiyatı</dt>
          <dd>
            <motion.span
              key={unit}
              className="inline-block font-display text-3xl font-semibold text-accent"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {formatMoney(unit, currency)}
            </motion.span>
          </dd>
        </div>
      </dl>

      <div className="flex items-stretch gap-2 sm:gap-3">
        <div className="flex items-center rounded-full border border-white/20">
          <button
            type="button"
            aria-label="Adedi azalt"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="inline-flex h-12 w-10 items-center justify-center text-lg disabled:opacity-30"
          >
            −
          </button>
          <span
            className="w-8 text-center text-sm font-semibold"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Adedi artır"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            disabled={quantity >= 20}
            className="inline-flex h-12 w-10 items-center justify-center text-lg disabled:opacity-30"
          >
            +
          </button>
        </div>
        <motion.button
          type="button"
          onClick={addToCart}
          disabled={!canAdd}
          whileTap={{ scale: 0.97 }}
          className="relative inline-flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-4 text-sm font-semibold whitespace-nowrap text-brand-dark transition hover:bg-[#e9bb3c] disabled:opacity-50"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justAdded ? "added" : "idle"}
              className="inline-flex items-center gap-2"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {justAdded ? (
                "Sepete eklendi ✓"
              ) : (
                <>
                  <BagIcon width={18} height={18} />
                  {pending
                    ? "Ekleniyor..."
                    : `Sepete ekle · ${formatMoney(unit * quantity, currency)}`}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {!hasVegetable ? (
        <p className="text-sm text-brand-cream/70">
          Sepete eklemek için en az bir sebze seçin.
        </p>
      ) : null}

      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${message.error ? "bg-red-50 text-red-700" : "bg-white/10 text-brand-cream"}`}
        >
          {message.text}
          {message.error ? null : (
            <>
              {" · "}
              <Link href="/sepet" className="underline">
                Sepete git
              </Link>
            </>
          )}
        </p>
      ) : null}
    </section>
  );
}
