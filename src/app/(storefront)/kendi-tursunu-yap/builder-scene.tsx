"use client";

import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import type { CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Bidon } from "./bidon";

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
    brine,
    spice,
    size,
    sizeIndex,
    maxIngredients,
  } = builder;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#f7f8f3] to-[#e9efdf] p-4">
      <div className="mx-auto w-full max-w-[15rem]">
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
      {vegetables.length > 0 ? (
        <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
          {vegetables.map((item) => (
            <li
              key={item.id}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-xs"
            >
              {item.name} %{shares[item.id]}
            </li>
          ))}
        </ul>
      ) : null}
      {aromas.length > 0 ? (
        <p className="mt-2 text-center text-xs text-slate-600">
          Aromalar: {aromas.map((item) => item.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
