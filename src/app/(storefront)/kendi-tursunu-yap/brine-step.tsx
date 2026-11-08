"use client";

import { motion } from "motion/react";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

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
