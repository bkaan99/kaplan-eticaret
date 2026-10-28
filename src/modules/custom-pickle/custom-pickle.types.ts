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

export const BRINE_OPTIONS = {
  VINEGAR: "Sirkeli",
  NATURAL: "Doğal fermente",
} as const;
export type BrineOption = keyof typeof BRINE_OPTIONS;

export const SPICE_OPTIONS = {
  MILD: "Acısız",
  MEDIUM: "Orta acı",
  HOT: "Acılı",
} as const;
export type SpiceOption = keyof typeof SPICE_OPTIONS;

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
