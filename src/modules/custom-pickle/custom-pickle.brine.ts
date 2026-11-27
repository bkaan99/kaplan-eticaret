import type { PickleBrineOption } from "./custom-pickle.types";

/**
 * Renk veren malzemeler: bir malzemeye `brineKey` atanmışsa, seçildiğinde
 * bidonun salamura (su) rengi en az o seviyeye çekilir.
 */

/** Otomatik salamura ataması; malzeme çıkınca önceki seçime dönülsün. */
export interface AutoBrine {
  key: string;
  previous: string;
}

/** Beyaz su varsayılan; kırmızı ve diğer renkli sular daha "güçlü" sayılır. */
export function brineStrength(key: string): number {
  if (key === "RED") return 2;
  if (key === "WHITE") return 0;
  return 1;
}

/** Seçili malzemelerin gerektirdiği en güçlü salamura (yoksa null). */
export function requiredBrine(
  ingredients: readonly { brineKey: string | null }[],
  brines: readonly PickleBrineOption[],
): PickleBrineOption | null {
  let strongest: PickleBrineOption | null = null;
  for (const ingredient of ingredients) {
    if (!ingredient.brineKey) continue;
    const option = brines.find(
      (item) => item.key === ingredient.brineKey && item.isActive,
    );
    if (
      option &&
      (!strongest ||
        brineStrength(option.key) > brineStrength(strongest.key))
    ) {
      strongest = option;
    }
  }
  return strongest;
}

export interface ResolvedBrine {
  brine: string;
  auto: AutoBrine | null;
  raised: PickleBrineOption | null;
}

/**
 * Malzeme seçimi değişince salamurayı belirler (acılık resolveSpice ile aynı mantık).
 */
export function resolveBrine(input: {
  current: string;
  auto: AutoBrine | null;
  required: PickleBrineOption | null;
  brines: readonly PickleBrineOption[];
}): ResolvedBrine {
  const { current, auto, required } = input;
  const strength = (key: string) => brineStrength(key);

  if (auto && current === auto.key) {
    const base = auto.previous;
    const target =
      required && strength(required.key) > strength(base)
        ? required.key
        : base;
    if (target === current) return { brine: current, auto, raised: null };
    const raised = target === base ? null : (required ?? null);
    return {
      brine: target,
      auto: target === base ? null : { key: target, previous: base },
      raised,
    };
  }

  if (required && strength(required.key) > strength(current)) {
    return {
      brine: required.key,
      auto: { key: required.key, previous: current },
      raised: required,
    };
  }

  return { brine: current, auto: null, raised: null };
}
