import { toDecimal } from "@/shared/money";
import type { IngredientRecord } from "./custom-pickle.repository";
import {
  BRINE_OPTIONS,
  isMonthInSeason,
  isStockAvailable,
  isStockCritical,
  SPICE_OPTIONS,
  type CustomPickleConfig,
  type IngredientView,
} from "./custom-pickle.types";

export function toView(
  record: IngredientRecord,
  now = new Date(),
): IngredientView {
  const currentMonth = now.getMonth() + 1;
  const inSeason = isMonthInSeason(
    record.seasonStartMonth,
    record.seasonEndMonth,
    currentMonth,
  );
  const inStock = isStockAvailable(record.stockKg);
  const isCriticalStock = isStockCritical(record.stockKg, record.minStockKg);
  const isAvailable = record.isActive && inStock && inSeason;

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    group: record.group,
    description: record.description,
    imageUrl: record.imageUrl,
    pricePerKg: toDecimal(record.pricePerKg).toFixed(2),
    stockKg: record.stockKg ? toDecimal(record.stockKg).toFixed(2) : null,
    minStockKg: record.minStockKg
      ? toDecimal(record.minStockKg).toFixed(2)
      : null,
    seasonStartMonth: record.seasonStartMonth,
    seasonEndMonth: record.seasonEndMonth,
    inStock,
    inSeason,
    isAvailable,
    isCriticalStock,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
  };
}

export function registerOptions(config: CustomPickleConfig) {
  for (const b of config.brines) {
    BRINE_OPTIONS[b.key] = b.label;
  }
  for (const s of config.spices) {
    SPICE_OPTIONS[s.key] = s.label;
  }
}
