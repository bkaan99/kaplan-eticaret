"use client";

import { motion } from "motion/react";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

/** Suyun rengini gösteren mini bardak. */
function WaterGlass({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-14 w-11 shrink-0 items-end justify-center overflow-hidden rounded-b-xl rounded-t-md border-2 border-white/80 bg-white/60 shadow-[0_0_0_1px_rgba(11,35,24,0.12),inset_0_2px_6px_rgba(255,255,255,0.8)]"
    >
      <span
        className="absolute inset-x-0 bottom-0 h-[78%]"
        style={{
          background: `linear-gradient(180deg, ${color}cc 0%, ${color} 100%)`,
        }}
      />
      <span className="absolute top-1.5 left-1 h-7 w-1 rounded-full bg-white/70" />
    </span>
  );
}

export function BrineStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { brine, setBrine, brines } = builder;

  return (
    <Step index={4} title="Salamura suyu">
      <div className="grid gap-3 sm:grid-cols-2">
        {brines.map((item) => {
          const active = brine === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setBrine(item.key)}
              className="relative flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition-colors hover:border-primary/40"
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
              <span className="relative">
                <WaterGlass color={item.color} />
              </span>
              <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-bold text-primary">
                  {item.label}
                </span>
                <span className="text-sm text-slate-600">
                  {item.description}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  active ? "border-primary bg-primary" : "border-slate-300"
                }`}
              >
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}
