"use client";

import { motion } from "motion/react";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import {
  findVariant,
  isValueAvailable,
} from "@/modules/catalog/variant-selection";
import { formatMoney } from "@/shared/money";
import type { ProductViewState } from "./use-product-view";

export function ProductOptions({
  product,
  state,
}: {
  product: ProductDetail;
  state: ProductViewState;
}) {
  const { selection, select } = state;

  return (
    <>
      {product.options.map((option) => (
        <fieldset key={option.id} className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">{option.name}</legend>
          <div className="flex flex-wrap gap-3">
            {option.values.map((value) => {
              const active = selection[option.id] === value.id;
              const available = isValueAvailable(
                product.variants,
                selection,
                option.id,
                value.id,
              );
              const candidate = findVariant(product.variants, product.options, {
                ...selection,
                [option.id]: value.id,
              });

              return (
                <button
                  key={value.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => select(option.id, value.id)}
                  className={[
                    "relative flex min-w-28 flex-col items-start gap-0.5 rounded-2xl border-2 border-border bg-white px-4 py-3 text-left transition-colors",
                    active ? "" : "hover:border-primary/40",
                    available ? "" : "opacity-40 line-through",
                  ].join(" ")}
                >
                  {active ? (
                    <motion.span
                      layoutId={`option-${option.id}`}
                      aria-hidden="true"
                      className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <span className="relative text-sm font-semibold">
                    {value.value}
                  </span>
                  {product.priceVisible && candidate ? (
                    <span className="relative text-xs text-muted-foreground">
                      {formatMoney(candidate.price, candidate.currency)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}
