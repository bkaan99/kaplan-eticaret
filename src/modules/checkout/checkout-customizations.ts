import {
  bidonWeightGram,
  type CustomizationPricer,
  type CustomizationQuote,
  type StoredCustomization,
} from "../custom-pickle/custom-pickle.types";
import { readStoredCustomization } from "../custom-pickle/custom-pickle.service";
import type { CheckoutLineRecord } from "./checkout.repository";

/** Özelleştirilmiş satırların güncel ek ücretleri; diğer satırlar için boş döner. */
export async function quoteCustomizations(
  lines: CheckoutLineRecord[],
  customizations?: CustomizationPricer,
): Promise<(CustomizationQuote | undefined)[]> {
  const result: (CustomizationQuote | undefined)[] = lines.map(() => undefined);
  if (!customizations) return result;

  const pending = lines
    .map((line, index) => ({
      index,
      customization: line.customizationKey
        ? readStoredCustomization(line.customization)
        : null,
      weightGram: bidonWeightGram(
        line.weightGram ?? null,
        line.optionLabels.join(" "),
      ),
    }))
    .filter(
      (
        entry,
      ): entry is {
        index: number;
        customization: StoredCustomization;
        weightGram: number | null;
      } => entry.customization !== null,
    );
  if (pending.length === 0) return result;

  const quotes = await customizations.quote(pending);
  pending.forEach((entry, position) => {
    result[entry.index] = quotes[position];
  });
  return result;
}
