"use client";

import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import type { CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { shareToGrams } from "@/modules/custom-pickle/custom-pickle.shares";
import { Bidon } from "./bidon";
import { formatGrams } from "./ratio-step";

export function BuilderScene({
  builder,
  sizes,
}: {
  builder: CustomPickleBuilderState;
  sizes: BuilderSize[];
}) {
  const {
    chosen,
    vegetables,
    aromas,
    shares,
    filled,
    isFull,
    brine,
    spice,
    size,
    sizeIndex,
    maxIngredients,
  } = builder;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-[#f7f8f3] to-[#e3ecd8] p-4 shadow-[0_1px_2px_rgba(11,35,24,0.04),0_12px_28px_-16px_rgba(11,35,24,0.16)]">
      <div className="flex items-center gap-4 lg:flex-col lg:gap-3">
        <div className="w-28 shrink-0 sm:w-36 lg:w-full lg:max-w-[15rem]">
          <Bidon
            items={chosen.map((item) => ({ ...item, share: shares[item.id] }))}
            brine={brine}
            spice={spice}
            brineColor={builder.activeBrine?.color}
            spiceTint={builder.activeSpice?.tint}
            hasBubbles={builder.activeBrine?.hasBubbles}
            sizeLabel={size?.label ?? ""}
            maxIngredients={maxIngredients}
            fill={chosen.length === 0 ? 0 : filled / 100}
            scale={
              sizes.length > 1
                ? 0.86 + (0.08 * Math.max(0, sizeIndex)) / (sizes.length - 1)
                : 0.92
            }
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:w-full lg:flex-none">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              {size?.label ?? "Bidon"}
            </span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                isFull ? "text-brand-leaf" : "text-primary"
              }`}
            >
              %{filled}
              <span className="ml-1 font-storefront text-xs font-semibold text-slate-500">
                dolu
              </span>
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Bidon doluluk oranı"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={filled}
            className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/70"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                isFull ? "bg-brand-leaf" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, filled)}%` }}
            />
          </div>
          {vegetables.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {vegetables.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-xs ring-1 ring-slate-200/60"
                >
                  {item.name}{" "}
                  {formatGrams(
                    shareToGrams(shares[item.id] ?? 0, size?.weightGram),
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              Malzeme seçtikçe bidon burada dolar.
            </p>
          )}
          {aromas.length > 0 ? (
            <p className="text-xs text-slate-600">
              Aromalar: {aromas.map((item) => item.name).join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
