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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      {/* Sol Sütun: Bidon ve Seçilen Malzemeler Sahnesi */}
      <BuilderScene builder={builder} sizes={sizes} />

      {/* Sağ Sütun: Yapılandırma Adımları ve Sepet Özeti */}
      <div className="flex flex-col gap-12">
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
