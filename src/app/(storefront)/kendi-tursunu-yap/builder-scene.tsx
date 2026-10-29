"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
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

  return (
    <div className="lg:sticky lg:top-40 lg:self-start">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-muted px-6 pt-8 pb-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-10 top-16 aspect-square rounded-full bg-white/60"
        />
        <div className="relative mx-auto max-w-sm">
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
                ? 0.84 + (0.16 * Math.max(0, sizeIndex)) / (sizes.length - 1)
                : 1
            }
          />
        </div>
        <div className="relative mt-4 flex min-h-9 flex-wrap justify-center gap-2">
          <AnimatePresence mode="popLayout">
            {chosen.length === 0 ? (
              <motion.p
                key="empty"
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Malzeme seçtikçe bidonunuz dolacak.
              </motion.p>
            ) : (
              chosen.map((item) => (
                <motion.button
                  layout
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-label={`${item.name} malzemesini çıkar`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white py-1 pr-2.5 pl-1 text-xs font-medium text-primary shadow-sm"
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
