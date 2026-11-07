"use client";

import { ArrowRightIcon } from "@/components/storefront/icons";
import { PICKLE_PRESETS } from "./pickle-presets";
import type { CustomPickleBuilderState } from "./use-custom-pickle-builder";

const cardClass =
  "group flex flex-col items-start gap-1 rounded-2xl border border-white/15 bg-white/5 p-4 text-left text-white transition-colors hover:border-amber-300/70 hover:bg-white/10";

/** Hazır karışımlar: tek dokunuşla bidonu doldurur, sonra her şey değiştirilebilir. */
export function BuilderPresets({
  builder,
}: {
  builder: CustomPickleBuilderState;
}) {
  return (
    <section
      aria-label="Hazır karışımlar"
      className="rounded-3xl bg-primary p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-bold text-white">
          Nereden başlayalım?
        </h2>
        <p className="text-sm text-white/75">
          Bir karışım seçin, bidon hazırlansın. Sonra dilediğinizi değiştirin.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {PICKLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => builder.applyPreset(preset)}
            className={cardClass}
          >
            <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
              {preset.badge}
            </span>
            <span className="text-sm font-bold sm:text-base">
              {preset.name}
            </span>
            <span className="text-xs leading-snug text-white/75">
              {preset.tagline}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={builder.applySurprise}
          className={cardClass}
        >
          <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            Sürpriz
          </span>
          <span className="text-sm font-bold sm:text-base">
            Şansıma ne çıkarsa
          </span>
          <span className="text-xs leading-snug text-white/75">
            Rastgele bir karışım
          </span>
        </button>
        <button type="button" onClick={builder.clear} className={cardClass}>
          <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            Serbest
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold sm:text-base">
            Kendim seçeceğim
            <ArrowRightIcon width={14} height={14} />
          </span>
          <span className="text-xs leading-snug text-white/75">
            Boş bidonla başla
          </span>
        </button>
      </div>
    </section>
  );
}
