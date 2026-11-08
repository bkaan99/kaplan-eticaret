"use client";

import { motion } from "motion/react";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";
import { PepperIcons } from "./size-step";

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
