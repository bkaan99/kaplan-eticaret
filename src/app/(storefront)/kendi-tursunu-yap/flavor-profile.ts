import type { IngredientView } from "@/modules/custom-pickle/custom-pickle.types";

interface Flavor {
  sour: number;
  crunch: number;
  heat: number;
  color: number;
}

/** Malzeme karakterleri (0–3). Panelden eklenen yeni malzemeler orta değer sayılır. */
const FLAVORS: Record<string, Flavor> = {
  salatalik: { sour: 2, crunch: 3, heat: 0, color: 1 },
  kornison: { sour: 3, crunch: 3, heat: 0, color: 1 },
  "beyaz-lahana": { sour: 3, crunch: 2, heat: 0, color: 0 },
  "kirmizi-lahana": { sour: 2, crunch: 2, heat: 0, color: 3 },
  havuc: { sour: 1, crunch: 3, heat: 0, color: 2 },
  "sivri-biber": { sour: 1, crunch: 2, heat: 2, color: 1 },
  "kirmizi-biber": { sour: 1, crunch: 1, heat: 1, color: 3 },
  karnabahar: { sour: 2, crunch: 3, heat: 0, color: 0 },
  pancar: { sour: 1, crunch: 1, heat: 0, color: 3 },
  "yesil-domates": { sour: 3, crunch: 2, heat: 0, color: 1 },
  ayva: { sour: 2, crunch: 1, heat: 0, color: 1 },
};
const DEFAULT_FLAVOR: Flavor = { sour: 2, crunch: 2, heat: 0, color: 1 };

const LEVELS = {
  sour: ["Tatlımsı", "Hafif", "Dengeli", "Keskin"],
  crunch: ["Yumuşak", "Hafif", "Çıtır", "Kıtır kıtır"],
  heat: ["Acısız", "Hafif acı", "Acılı", "Çok acılı"],
  color: ["Sade", "Sade", "Renkli", "Rengârenk"],
} as const;

export interface FlavorMeter {
  label: string;
  /** 0–1 */
  value: number;
  text: string;
}

export function flavorProfile(
  vegetables: IngredientView[],
  shares: Record<string, number>,
  peppers: number,
): FlavorMeter[] | null {
  const total = vegetables.reduce((sum, v) => sum + (shares[v.id] ?? 0), 0);
  if (total === 0) return null;

  const avg = (key: keyof Flavor) =>
    vegetables.reduce(
      (sum, v) =>
        sum + (FLAVORS[v.slug] ?? DEFAULT_FLAVOR)[key] * (shares[v.id] ?? 0),
      0,
    ) / total;
  // Salamuranın acısı karışımın acısına eklenir.
  const heat = Math.min(3, avg("heat") + Math.min(peppers, 3));

  const meter = (
    label: string,
    key: keyof Flavor,
    raw: number,
  ): FlavorMeter => ({
    label,
    value: raw / 3,
    text: LEVELS[key][Math.round(raw)]!,
  });
  return [
    meter("Ekşilik", "sour", avg("sour")),
    meter("Acılık", "heat", heat),
    meter("Çıtırlık", "crunch", avg("crunch")),
    meter("Renk", "color", avg("color")),
  ];
}

/** Karışımın en baskın iki sebzesinden kısa bir tarif cümlesi. */
export function mixNote(
  vegetables: IngredientView[],
  shares: Record<string, number>,
): string {
  if (vegetables.length === 0) {
    return "Hazır bir karışım seçin ya da sebzeleri kendiniz ekleyin.";
  }
  const [first, second] = [...vegetables].sort(
    (a, b) => (shares[b.id] ?? 0) - (shares[a.id] ?? 0),
  );
  if (!second) return `Bidonun tamamı ${first!.name}; sade ve net bir tat.`;
  return `Karışımın baskın tadı ${first!.name}, ${second.name} ona eşlik ediyor.`;
}
