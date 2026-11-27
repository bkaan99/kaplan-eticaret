"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addShare,
  decreaseShare,
  equalShares,
  FULL_SHARE,
  increaseShare,
  removeShare,
  totalShare,
  type PickleShares,
} from "@/modules/custom-pickle/custom-pickle.shares";
import {
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  maxIngredientsForSize,
  type IngredientGroup,
  type IngredientView,
  type PickleBrineOption,
  type PickleSpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { trackEvent } from "@/shared/analytics/client";
import { refreshStorefrontShell } from "@/components/storefront/shell-events";
import { addCustomPickleAction } from "./actions";
import { flavorProfile, mixNote } from "./flavor-profile";
import type { PicklePreset } from "./pickle-presets";
import {
  requiredBrine,
  resolveBrine,
  type AutoBrine,
} from "@/modules/custom-pickle/custom-pickle.brine";
import {
  requiredSpice,
  resolveSpice,
  type AutoSpice,
} from "@/modules/custom-pickle/custom-pickle.spice";

export interface BuilderMessage {
  text: string;
  error: boolean;
}

/** Sunucudaki hesapla aynı: kg başı ücret × bidon kilosu × pay, kuruşa yuvarlanır. */
export function extraFor(
  ingredient: IngredientView,
  size: BuilderSize | undefined,
  share: number = FULL_SHARE,
): number {
  const kg = size?.weightGram ? size.weightGram / 1000 : 1;
  return Math.round(Number(ingredient.pricePerKg) * kg * share) / FULL_SHARE;
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
  const [shares, setShares] = useState<PickleShares>({});
  const [brine, setBrineState] = useState<string>(
    () => brines[0]?.key ?? "WHITE",
  );
  const [spice, setSpiceState] = useState<string>(
    () => spices[1]?.key ?? spices[0]?.key ?? "MEDIUM",
  );
  // Acılı / renk veren malzeme seçilince sistemin yaptığı yükseltme.
  const [autoSpice, setAutoSpice] = useState<AutoSpice | null>(null);
  const [autoBrine, setAutoBrine] = useState<AutoBrine | null>(null);
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<BuilderMessage | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  // Bilgi mesajları kendiliğinden kapanır; hatalar kullanıcı değişiklik yapana kadar kalır.
  useEffect(() => {
    if (!message || message.error) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const size = sizes.find((item) => item.variantId === variantId);
  const sizeIndex = sizes.findIndex((item) => item.variantId === variantId);
  const currency = size?.currency ?? "TRY";
  const maxIngredients = maxIngredientsForSize(size?.weightGram ?? null);

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

  const vegetables = chosen.filter((item) => item.group === "VEGETABLE");
  const aromas = chosen.filter((item) => item.group !== "VEGETABLE");
  const base = Number(size?.price ?? 0);
  const extras = chosen.reduce(
    (sum, item) => sum + extraFor(item, size, shares[item.id]),
    0,
  );
  const unit = Math.round((base + extras) * 100) / 100;
  const hasVegetable = vegetables.length > 0;
  const filled = totalShare(shares);
  const isFull = hasVegetable && filled === FULL_SHARE;
  const full = selected.length >= maxIngredients;
  const canAdd = Boolean(size?.inStock) && isFull && !pending;
  const activeSpiceOption = spices.find((item) => item.key === spice);
  const profile = flavorProfile(
    vegetables,
    shares,
    activeSpiceOption?.peppers ?? 0,
    brine === "RED" ? 1 : 0,
  );
  const mixText = mixNote(vegetables, shares);

  /** Seçimi uygular; sebze oranları verilmediyse eşit dağıtılır. */
  function applySelection(ids: string[], nextShares?: PickleShares) {
    setSelected(ids);
    setShares(
      nextShares ??
        equalShares(ids.filter((id) => byId.get(id)?.group === "VEGETABLE")),
    );
    syncSpice(ids);
    syncBrine(ids);
  }

  /** Acılı malzeme seçildiyse acılığı en az o seviyeye çeker; çıkarılınca geri alır. */
  function syncSpice(ids: string[]) {
    const picked = ids
      .map((id) => byId.get(id))
      .filter((item): item is IngredientView => item !== undefined);
    const result = resolveSpice({
      current: spice,
      auto: autoSpice,
      required: requiredSpice(picked, spices),
      spices,
    });
    setSpiceState(result.spice);
    setAutoSpice(result.auto);
    if (result.raised) {
      const raised = result.raised;
      const names = picked
        .filter((item) => item.spiceKey === raised.key)
        .map((item) => item.name)
        .join(", ");
      setMessage({
        text: `${names || "Seçtiğiniz malzeme"} acılı olduğu için acılık "${raised.label}" olarak ayarlandı. Dilerseniz değiştirebilirsiniz.`,
        error: false,
      });
    }
  }

  /** Renk veren malzeme seçildiyse suyu o renge çeker; çıkarılınca geri alır. */
  function syncBrine(ids: string[]) {
    const picked = ids
      .map((id) => byId.get(id))
      .filter((item): item is IngredientView => item !== undefined);
    const result = resolveBrine({
      current: brine,
      auto: autoBrine,
      required: requiredBrine(picked, brines),
      brines,
    });
    setBrineState(result.brine);
    setAutoBrine(result.auto);
    if (result.raised) {
      const raised = result.raised;
      const names = picked
        .filter((item) => item.brineKey === raised.key)
        .map((item) => item.name)
        .join(", ");
      setMessage({
        text: `${names || "Seçtiğiniz malzeme"} suyu boyadığı için salamura "${raised.label}" olarak ayarlandı. Dilerseniz değiştirebilirsiniz.`,
        error: false,
      });
    }
  }

  /** Müşterinin elle seçimi: otomatik ayarlama kaydı bırakılır. */
  function setSpice(key: string) {
    setSpiceState(key);
    setAutoSpice(null);
  }

  function setBrine(key: string) {
    setBrineState(key);
    setAutoBrine(null);
  }

  function selectSize(nextVariantId: string) {
    const next = sizes.find((item) => item.variantId === nextVariantId);
    const limit = maxIngredientsForSize(next?.weightGram ?? null);
    setVariantId(nextVariantId);
    if (selected.length > limit) {
      applySelection(selected.slice(0, limit));
      setMessage({
        text: `Bu boyutta en fazla ${limit} malzeme seçilebilir; fazla seçimler kaldırıldı`,
        error: false,
      });
    } else {
      setMessage(null);
    }
  }

  function toggle(id: string) {
    setMessage(null);
    const isVegetable = byId.get(id)?.group === "VEGETABLE";
    if (selected.includes(id)) {
      // Müşterinin elle ayarladığı oranlar korunur; açılan pay kalanlara dağılır.
      applySelection(
        selected.filter((item) => item !== id),
        isVegetable ? removeShare(shares, id) : shares,
      );
    } else if (!full) {
      // Yeni sebze 2-3 adımla (3 kg'da 300-450 g) girer; mevcut oranlar korunur.
      applySelection(
        [...selected, id],
        isVegetable ? addShare(shares, id) : shares,
      );
    }
  }

  function changeShare(id: string, direction: 1 | -1) {
    setShares((current) =>
      direction === 1 ? increaseShare(current, id) : decreaseShare(current, id),
    );
  }

  function balanceShares() {
    setShares(equalShares(vegetables.map((item) => item.id)));
  }

  function clear() {
    applySelection([]);
    setMessage(null);
  }

  /** Karışıma sığan en küçük stoktaki boyutu seçer. */
  function fitSize(count: number) {
    const fitting =
      sizes.find(
        (item) =>
          item.inStock && maxIngredientsForSize(item.weightGram) >= count,
      ) ?? sizes.findLast((item) => item.inStock);
    if (fitting) setVariantId(fitting.variantId);
    return fitting;
  }

  function applyPreset(preset: PicklePreset) {
    // Mevsim dışı veya tükenmiş malzeme eklenmez (sepete eklerken reddedilirdi).
    const found = preset.ingredients.flatMap((entry) => {
      const item = ingredients.find((other) => other.slug === entry.slug);
      return item?.isAvailable ? [{ item, share: entry.share }] : [];
    });
    if (!found.some((entry) => entry.item.group === "VEGETABLE")) {
      setMessage({
        text: `${preset.name} için gereken sebzeler şu an satışta değil. Malzemeleri kendiniz seçebilirsiniz.`,
        error: false,
      });
      return;
    }
    const fitting = fitSize(found.length);
    const limit = maxIngredientsForSize(fitting?.weightGram ?? null);
    const picked = found.slice(0, limit);
    const veg = picked.filter((entry) => entry.item.group === "VEGETABLE");
    const given = Object.fromEntries(
      veg.map((entry) => [entry.item.id, entry.share ?? 0]),
    );
    const valid = totalShare(given) === FULL_SHARE && veg.every((e) => e.share);

    applySelection(
      picked.map((entry) => entry.item.id),
      valid ? given : undefined,
    );
    if (preset.brine && brines.some((item) => item.key === preset.brine)) {
      setBrine(preset.brine);
    }
    if (preset.spice && spices.some((item) => item.key === preset.spice)) {
      setSpice(preset.spice);
    }
    setMessage({
      text: `${preset.name} hazır · ${picked.length} malzeme, ${fitting?.label ?? "bidon"}. Dilediğinizi değiştirebilirsiniz.`,
      error: false,
    });
  }

  function applySurprise() {
    const shuffle = <T>(items: T[]) =>
      items
        .map((item) => ({ item, key: Math.random() }))
        .sort((a, b) => a.key - b.key)
        .map(({ item }) => item);
    const veg = ingredients.filter((item) => item.group === "VEGETABLE");
    const rest = ingredients.filter((item) => item.group !== "VEGETABLE");
    const picked = [...shuffle(veg).slice(0, 3), ...shuffle(rest).slice(0, 1)];
    fitSize(picked.length);
    applySelection(picked.map((item) => item.id));
    setMessage({
      text: `Sürpriz karışım hazır: ${picked.map((item) => item.name).join(", ")}.`,
      error: false,
    });
  }

  function addToCart() {
    if (!size) return;
    startTransition(async () => {
      const result = await addCustomPickleAction({
        variantId,
        ingredientIds: selected,
        shares,
        brine,
        spice,
        note,
        title: title.trim() || null,
        quantity,
      });
      if (!result.ok) {
        setMessage({ text: result.error ?? "Sepete eklenemedi", error: true });
        return;
      }
      setMessage({ text: "Bidonunuz sepete eklendi", error: false });
      setJustAdded(true);
      refreshStorefrontShell();
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

  const activeBrine = brines.find((item) => item.key === brine) ?? brines[0];
  const activeSpice = spices.find((item) => item.key === spice) ?? spices[0];

  return {
    variantId,
    setVariantId,
    selectSize,
    selected,
    shares,
    filled,
    isFull,
    vegetables,
    aromas,
    profile,
    mixNote: mixText,
    changeShare,
    balanceShares,
    clear,
    applyPreset,
    applySurprise,
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
    title,
    setTitle,
    quantity,
    setQuantity,
    pending,
    message,
    setMessage,
    justAdded,
    size,
    sizeIndex,
    maxIngredients,
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

export type CustomPickleBuilderState = ReturnType<
  typeof useCustomPickleBuilder
>;
