import type {
  CustomizationQuote,
  ItemCustomizationHandler,
} from "../cart/customization";
import type { CheckoutLineRecord } from "./checkout.repository";

/** Özelleştirilmiş satırların güncel ek ücretleri; diğer satırlar için boş döner. */
export async function quoteCustomizations(
  lines: CheckoutLineRecord[],
  customizations?: ItemCustomizationHandler,
): Promise<(CustomizationQuote | undefined)[]> {
  if (!customizations) return lines.map(() => undefined);
  return customizations.quote(lines);
}
