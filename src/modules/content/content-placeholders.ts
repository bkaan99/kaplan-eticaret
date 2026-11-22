/**
 * Sayfa içeriğindeki dinamik yer tutucular. Yönetici panelinde veya şablonlarda
 * `{{ucretsiz_kargo_esigi}}` yazılır; sayfa gösterilirken güncel ayar değeriyle
 * ("500 TL") değiştirilir. Böylece eşik değişince metinler elle düzenlenmez.
 */
export const FREE_SHIPPING_PLACEHOLDER = "{{ucretsiz_kargo_esigi}}";

/** Tam tutarlar "500 TL", kuruşlu tutarlar "499,90 TL" biçiminde yazılır. */
export function formatThresholdText(amount: number): string {
  const text = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${text} TL`;
}

export function fillContentPlaceholders(
  content: string,
  values: { freeShippingThreshold: number },
): string {
  return content.replaceAll(
    FREE_SHIPPING_PLACEHOLDER,
    formatThresholdText(values.freeShippingThreshold),
  );
}
