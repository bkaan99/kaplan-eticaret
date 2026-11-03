"use client";

import type {
  IngredientView,
  PickleBrineOption,
  PickleSpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { useCustomPickleBuilder } from "./use-custom-pickle-builder";
import { BuilderBar } from "./builder-bar";
import { BuilderInsights } from "./builder-insights";
import { BuilderPresets } from "./builder-presets";
import { BuilderScene } from "./builder-scene";
import {
  BrineStep,
  IngredientsStep,
  NoteStep,
  RatioStep,
  SizeStep,
  SpiceStep,
} from "./builder-steps";
import { FlyToBidonOverlay } from "./fly-to-bidon";

/**
 * "Kendi Turşunu Yap" ana bileşeni (Orchestrator).
 * Durum yönetimi `useCustomPickleBuilder` hook'una, görsel adımlar ve özet ise
 * odaklı alt bileşenlere delege edilmiştir (Single Responsibility Principle).
 */
export function Builder({
  sizes,
  ingredients,
  brines,
  spices,
}: {
  sizes: BuilderSize[];
  ingredients: IngredientView[];
  brines?: PickleBrineOption[];
  spices?: PickleSpiceOption[];
}) {
  const builder = useCustomPickleBuilder(sizes, ingredients, brines, spices);

  return (
    <div className="flex flex-col gap-6">
      <FlyToBidonOverlay />
      <BuilderPresets builder={builder} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Dar ekranda bidon adımların üstünde; genişte sağda sabit */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-40 lg:order-last">
          <BuilderScene builder={builder} sizes={sizes} />
          <div className="hidden lg:block">
            <BuilderInsights builder={builder} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <SizeStep sizes={sizes} builder={builder} />
          <IngredientsStep builder={builder} />
          <RatioStep builder={builder} />
          <BrineStep builder={builder} />
          <SpiceStep builder={builder} />
          <NoteStep builder={builder} />
          <div className="lg:hidden">
            <BuilderInsights builder={builder} />
          </div>
        </div>
      </div>

      <BuilderBar builder={builder} />
    </div>
  );
}
