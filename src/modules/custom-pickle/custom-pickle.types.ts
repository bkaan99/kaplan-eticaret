import type Decimal from "decimal.js";

/** "Kendi turşunu yap" bidonlarının katalogdaki ürünü; boyutlar bu ürünün varyantlarıdır. */
export const CUSTOM_PICKLE_PRODUCT_SLUG = "kendi-tursunu-yap";

/**
 * Bidonun ağırlığı (gram): varyantta tanımlıysa o, değilse boyut adından
 * okunur ("5 kg bidon", "750 g", "3 L"). Bulunamazsa null (1 kg sayılır).
 */
export function bidonWeightGram(
  weightGram: number | null,
  label: string | null,
): number | null {
  if (weightGram && weightGram > 0) return weightGram;
  const match = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|l|lt|litre|g|gr)\b/i.exec(
    label ?? "",
  );
  if (!match) return null;
  const amount = Number(match[1]!.replace(",", "."));
  const unit = match[2]!.toLowerCase();
  return Math.round(unit === "g" || unit === "gr" ? amount : amount * 1000);
}

/** Bir bidona eklenebilecek en fazla malzeme */
export const MAX_INGREDIENTS = 8;
/** Müşteri notunun en fazla uzunluğu */
export const MAX_NOTE_LENGTH = 200;

export type IngredientGroup = "VEGETABLE" | "AROMA";

export const INGREDIENT_GROUP_LABELS: Record<IngredientGroup, string> = {
  VEGETABLE: "Sebzeler",
  AROMA: "Baharat ve aroma",
};

export interface PickleBrineOption {
  key: string;
  label: string;
  description: string;
  color: string;
  hasBubbles?: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PickleSpiceOption {
  key: string;
  label: string;
  description?: string | null;
  peppers: number;
  tint: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CustomPickleConfig {
  brines: PickleBrineOption[];
  spices: PickleSpiceOption[];
}

export const DEFAULT_BRINE_CONFIG: PickleBrineOption[] = [
  {
    key: "VINEGAR",
    label: "Sirkeli",
    description:
      "Geleneksel sirke ve kaya tuzu dengesi. Klasik kıtır lezzet, net asidite.",
    color: "#d6e29a",
    hasBubbles: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    key: "NATURAL",
    label: "Doğal fermente",
    description:
      "Yalnızca kaya tuzu ve sarımsak; fermantasyon probiyotik bakterilerle gerçekleşir.",
    color: "#e7d9a0",
    hasBubbles: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    key: "APPLE_CIDER",
    label: "Elma Sirkeli",
    description:
      "Yumuşak içimli, meyvemsi dengeli asidite ve kaya tuzu aroması.",
    color: "#fef08a",
    hasBubbles: false,
    isActive: true,
    sortOrder: 2,
  },
];

export const DEFAULT_SPICE_CONFIG: PickleSpiceOption[] = [
  {
    key: "MILD",
    label: "Acısız",
    description: "Sıfır acı, çocukların ve hassas damakların tercihi.",
    peppers: 0,
    tint: 0,
    isActive: true,
    sortOrder: 0,
  },
  {
    key: "MEDIUM",
    label: "Orta acı",
    description: "Hafif acı biber dokunuşuyla dengeli ve leziz.",
    peppers: 1,
    tint: 0.1,
    isActive: true,
    sortOrder: 1,
  },
  {
    key: "HOT",
    label: "Acılı",
    description: "Damakta iz bırakan geleneksel acı biber lezzeti.",
    peppers: 3,
    tint: 0.22,
    isActive: true,
    sortOrder: 2,
  },
  {
    key: "EXTRA_HOT",
    label: "Çok Acılı (Atom)",
    description: "Acı tutkunlarına özel ekstra Arnavut biberi takviyeli.",
    peppers: 4,
    tint: 0.38,
    isActive: true,
    sortOrder: 3,
  },
];

export const BRINE_OPTIONS: Record<string, string> = {
  VINEGAR: "Sirkeli",
  NATURAL: "Doğal fermente",
  APPLE_CIDER: "Elma Sirkeli",
};
export type BrineOption = string;

export const SPICE_OPTIONS: Record<string, string> = {
  MILD: "Acısız",
  MEDIUM: "Orta acı",
  HOT: "Acılı",
  EXTRA_HOT: "Çok Acılı (Atom)",
};
export type SpiceOption = string;

/** Sepette saklanan seçim; fiyatlar her hesaplamada güncel malzeme fiyatlarından gelir. */
export interface StoredCustomization {
  kind: "custom-pickle";
  ingredientIds: string[];
  brine: BrineOption;
  spice: SpiceOption;
  note: string | null;
}

/** Siparişe yazılan kopya: malzeme değişse de sipariş içeriği korunur. */
export interface CustomizationSnapshot {
  kind: "custom-pickle";
  ingredients: { id: string; name: string; unitExtra: string }[];
  brine: string;
  spice: string;
  note: string | null;
}

export interface IngredientView {
  id: string;
  name: string;
  slug: string;
  group: IngredientGroup;
  description: string | null;
  imageUrl: string | null;
  pricePerKg: string;
  isActive: boolean;
  sortOrder: number;
}

/** Bir özelleştirmenin fiyatlandırılmış hâli (sepet/checkout). */
export interface CustomizationQuote {
  /** Bidon başına ek ücret (KDV dahil) */
  extra: Decimal;
  /** Malzemelerden biri satıştan kalktıysa false */
  available: boolean;
  /** Satırda gösterilecek özet: "Salatalık, Havuç · Sirkeli · Orta acı" */
  summary: string;
  snapshot: CustomizationSnapshot;
}

/** Sepet ve checkout'un özelleştirmeden yalnızca ihtiyaç duyduğu parça. */
export interface CustomizationPricer {
  quote(
    lines: { customization: StoredCustomization; weightGram: number | null }[],
  ): Promise<CustomizationQuote[]>;
}
