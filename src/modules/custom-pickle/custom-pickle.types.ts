import type Decimal from "decimal.js";
import type {
  CustomizationQuote as BaseCustomizationQuote,
  CustomizationLineItem,
  ItemCustomizationHandler,
} from "../cart/customization";

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

/** Bir bidona eklenebilecek mutlak üst sınır (10 kg). */
export const MAX_INGREDIENTS = 8;
/** Müşteri notunun en fazla uzunluğu */
export const MAX_NOTE_LENGTH = 200;

/**
 * Bidon kilosuna göre çeşit üst sınırı:
 * 3 kg → 4, 5 kg → 6, 10 kg → 8.
 * Ağırlık yoksa en düşük limite düşer.
 */
export function maxIngredientsForSize(weightGram: number | null): number {
  const kg = weightGram && weightGram > 0 ? weightGram / 1000 : 0;
  if (kg <= 3) return 4;
  if (kg <= 5) return 6;
  return MAX_INGREDIENTS;
}

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
  /** Sebze oranları (%10 adım, toplam 100). Eski sepet satırlarında yoktur. */
  shares?: Record<string, number>;
  brine: BrineOption;
  spice: SpiceOption;
  note: string | null;
}

/** Siparişe yazılan kopya: malzeme değişse de sipariş içeriği korunur. */
export interface CustomizationSnapshot {
  kind: "custom-pickle";
  ingredients: {
    id: string;
    name: string;
    unitExtra: string;
    share?: number;
  }[];
  brine: string;
  spice: string;
  note: string | null;
}

export const MONTH_NAMES_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export function formatSeasonRange(
  start: number | null | undefined,
  end: number | null | undefined,
): string {
  if (!start || !end) return "Tüm Yıl";
  const startName = MONTH_NAMES_TR[start - 1] ?? "";
  const endName = MONTH_NAMES_TR[end - 1] ?? "";
  return `${startName} - ${endName}`;
}

/** Verilen ay (1-12) malzemenin mevsiminde mi? */
export function isMonthInSeason(
  startMonth: number | null | undefined,
  endMonth: number | null | undefined,
  month = new Date().getMonth() + 1,
): boolean {
  if (!startMonth || !endMonth) return true;
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  // Yıl dönümünü aşan mevsimler (örn: Kasım (11) - Şubat (2))
  return month >= startMonth || month <= endMonth;
}

/** Stok miktarı pozitif mi? (null/undefined = limitsiz stok) */
export function isStockAvailable(
  stockKg: Decimal.Value | null | undefined,
): boolean {
  if (stockKg === null || stockKg === undefined) return true;
  return Number(stockKg) > 0;
}

/** Stok kritik seviyede veya altında mı? */
export function isStockCritical(
  stockKg: Decimal.Value | null | undefined,
  minStockKg: Decimal.Value | null | undefined,
): boolean {
  if (
    stockKg === null ||
    stockKg === undefined ||
    minStockKg === null ||
    minStockKg === undefined
  ) {
    return false;
  }
  return Number(stockKg) <= Number(minStockKg);
}

export interface IngredientView {
  id: string;
  name: string;
  slug: string;
  group: IngredientGroup;
  description: string | null;
  imageUrl: string | null;
  pricePerKg: string;
  stockKg: string | null;
  minStockKg: string | null;
  seasonStartMonth: number | null;
  seasonEndMonth: number | null;
  inStock: boolean;
  inSeason: boolean;
  isAvailable: boolean;
  isCriticalStock: boolean;
  isActive: boolean;
  sortOrder: number;
}

/** Bir turşu özelleştirmesinin fiyatlandırılmış hâli (sepet/checkout). */
export interface CustomizationQuote extends BaseCustomizationQuote {
  /** Bidon başına ek ücret (KDV dahil) */
  extra: Decimal;
  /** Malzemelerden biri satıştan kalktıysa false */
  available: boolean;
  /** Satırda gösterilecek özet: "Salatalık, Havuç · Sirkeli · Orta acı" */
  summary: string;
  snapshot: CustomizationSnapshot;
}

/** Geriye dönük uyumluluk için özelleştirme işleyicisi tipi. */
export type CustomizationPricer = ItemCustomizationHandler;
