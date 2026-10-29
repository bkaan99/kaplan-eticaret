"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  MAX_INGREDIENTS,
  type BrineOption,
  type IngredientGroup,
  type IngredientView,
  type PickleBrineOption,
  type PickleSpiceOption,
  type SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { trackEvent } from "@/shared/analytics/client";
import { addCustomPickleAction } from "./actions";

export interface BuilderMessage {
  text: string;
  error: boolean;
}

/** Sunucudaki hesapla aynı: kg başı ücret × bidon kilosu, kuruşa yuvarlanır. */
export function extraFor(
  ingredient: IngredientView,
  size: BuilderSize | undefined,
): number {
  const kg = size?.weightGram ? size.weightGram / 1000 : 1;
  return Math.round(Number(ingredient.pricePerKg) * kg * 100) / 100;
}

export function useCustomPickleBuilder(
  sizes: BuilderSize[],
  ingredients: IngredientView[],
  brinesConfig?: PickleBrineOption[],
  spicesConfig?: PickleSpiceOption[],
) {
  const brines = useMemo(
    () =>
      brinesConfig && brinesConfig.length > 0
        ? brinesConfig
        : DEFAULT_BRINE_CONFIG,
    [brinesConfig],
  );
  const spices = useMemo(
    () =>
      spicesConfig && spicesConfig.length > 0
        ? spicesConfig
        : DEFAULT_SPICE_CONFIG,
    [spicesConfig],
  );

  const [variantId, setVariantId] = useState(
    () => (sizes.find((size) => size.inStock) ?? sizes[0])!.variantId,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [brine, setBrine] = useState<string>(
    () => brines[0]?.key ?? "VINEGAR",
  );
  const [spice, setSpice] = useState<string>(
    () => spices[1]?.key ?? spices[0]?.key ?? "MEDIUM",
  );
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<BuilderMessage | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const size = sizes.find((item) => item.variantId === variantId);
  const sizeIndex = sizes.findIndex((item) => item.variantId === variantId);
  const currency = size?.currency ?? "TRY";

  const byId = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients],
  );

  const chosen = selected
    .map((id) => byId.get(id))
    .filter((item): item is IngredientView => item !== undefined);

  const groups = useMemo(() => {
    const map = new Map<IngredientGroup, IngredientView[]>();
    for (const item of ingredients) {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return [...map.entries()];
  }, [ingredients]);

  const base = Number(size?.price ?? 0);
  const extras = chosen.reduce((sum, item) => sum + extraFor(item, size), 0);
  const unit = Math.round((base + extras) * 100) / 100;
  const hasVegetable = chosen.some((item) => item.group === "VEGETABLE");
  const full = selected.length >= MAX_INGREDIENTS;
  const canAdd = Boolean(size?.inStock) && hasVegetable && !pending;

  function toggle(id: string) {
    setMessage(null);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= MAX_INGREDIENTS
          ? current
          : [...current, id],
    );
  }

  function addToCart() {
    if (!size) return;
    startTransition(async () => {
      const result = await addCustomPickleAction({
        variantId,
        ingredientIds: selected,
        brine,
        spice,
        note,
        quantity,
      });
      if (!result.ok) {
        setMessage({ text: result.error ?? "Sepete eklenemedi", error: true });
        return;
      }
      setMessage({ text: "Bidonunuz sepete eklendi", error: false });
      setJustAdded(true);
      trackEvent("add_to_cart", {
        currency,
        value: unit * quantity,
        item: {
          id: variantId,
          name: "Kendi Turşunu Yap",
          price: unit,
          quantity,
          variant: size.label,
          brand: null,
        },
      });
    });
  }

  const activeBrine =
    brines.find((item) => item.key === brine) ?? brines[0];
  const activeSpice =
    spices.find((item) => item.key === spice) ?? spices[0];

  return {
    variantId,
    setVariantId,
    selected,
    setSelected,
    brines,
    spices,
    activeBrine,
    activeSpice,
    brine,
    setBrine,
    spice,
    setSpice,
    note,
    setNote,
    quantity,
    setQuantity,
    pending,
    message,
    setMessage,
    justAdded,
    size,
    sizeIndex,
    currency,
    chosen,
    groups,
    base,
    extras,
    unit,
    hasVegetable,
    full,
    canAdd,
    toggle,
    addToCart,
  };
}

export type CustomPickleBuilderState = ReturnType<typeof useCustomPickleBuilder>;
