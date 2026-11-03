"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { MAX_INGREDIENTS } from "@/modules/custom-pickle/custom-pickle.types";
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
  const { chosen, brine, spice, size, sizeIndex, toggle } = builder;
  const fillPct = Math.min(
    100,
    Math.round((chosen.length / MAX_INGREDIENTS) * 100),
  );

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-[#f6f8f2] via-[#e9efdf] to-[#dce5d0] px-2 pt-4 pb-5 sm:px-3 sm:pt-5">
        {/* Atmosfer — yumuşak ışık halkası */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-6 aspect-square rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.35)_45%,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-24 h-24 rounded-[100%] bg-[#0b2318]/[0.04] blur-2xl"
        />

        <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[22rem]">
          <Bidon
            items={chosen}
            brine={brine}
            spice={spice}
            brineColor={builder.activeBrine?.color}
            spiceTint={builder.activeSpice?.tint}
            hasBubbles={builder.activeBrine?.hasBubbles}
            sizeLabel={size?.label ?? ""}
            scale={
              sizes.length > 1
                ? 0.86 + (0.08 * Math.max(0, sizeIndex)) / (sizes.length - 1)
                : 0.92
            }
          />
        </div>

        <div className="relative mt-1 flex flex-col items-center gap-1 px-2 text-center">
          <p className="font-display text-lg font-semibold text-brand-dark tabular-nums sm:text-xl">
            %{fillPct} dolu
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              · {chosen.length}/{MAX_INGREDIENTS} malzeme
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {size?.label
              ? `${size.label} · malzeme seçtikçe bidonunuz dolacak`
              : "Malzeme seçtikçe bidonunuz dolacak"}
          </p>
        </div>

        <div className="relative mt-4 flex min-h-9 flex-wrap justify-center gap-2 px-1">
          <AnimatePresence mode="popLayout">
            {chosen.length === 0 ? null : (
              chosen.map((item) => (
                <motion.button
                  layout
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-label={`${item.name} malzemesini çıkar`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/95 py-1 pr-2.5 pl-1 text-xs font-medium text-primary shadow-sm backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Image
                    src={item.imageUrl ?? "/placeholder.svg"}
                    alt=""
                    width={22}
                    height={22}
                  />
                  {item.name}
                  <span aria-hidden="true" className="text-muted-foreground">
                    ×
                  </span>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
