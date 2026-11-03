"use client";

import type {
  IngredientView,
  PickleBrineOption,
  PickleSpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { useCustomPickleBuilder } from "./use-custom-pickle-builder";
import { BuilderScene } from "./builder-scene";
import {
  BrineStep,
  IngredientsStep,
  NoteStep,
  SizeStep,
  SpiceStep,
} from "./builder-steps";
import { BuilderSummary } from "./builder-summary";
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,12fr)] lg:gap-12 xl:gap-16">
      <FlyToBidonOverlay />
      {/* Sol: bidon sahnesi — görsel odak */}
      <BuilderScene builder={builder} sizes={sizes} />

      {/* Sağ: adımlar + özet */}
      <div className="flex flex-col gap-10 sm:gap-12">
        <SizeStep sizes={sizes} builder={builder} />
        <IngredientsStep builder={builder} />
        <BrineStep builder={builder} />
        <SpiceStep builder={builder} />
        <NoteStep builder={builder} />
        <BuilderSummary builder={builder} />
      </div>
    </div>
  );
}
