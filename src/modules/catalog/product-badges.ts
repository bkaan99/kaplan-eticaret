/** Ürün niteliği (slug'larıyla) — kart rozetleri için. */
export interface BadgeAttribute {
  attributeSlug: string;
  valueSlug: string;
  value: string;
}

/**
 * Kartta rozet olarak gösterilecek nitelikler. Değer listesi `null` ise
 * niteliğin tüm değerleri gösterilir; aksi halde yalnızca listedekiler.
 */
export const CARD_BADGE_RULES: Record<string, readonly string[] | null> = {
  yapim: null,
  acilik: ["acili"],
};

/** En fazla bu kadar rozet; kart kalabalıklaşmasın. */
export const MAX_CARD_BADGES = 2;

/** Nitelik listesinden kural sırasına göre ürün kartı rozetlerini üretir. */
export function productBadges(attributes: readonly BadgeAttribute[]): string[] {
  const badges: string[] = [];
  for (const [attributeSlug, allowed] of Object.entries(CARD_BADGE_RULES)) {
    for (const attribute of attributes) {
      if (attribute.attributeSlug !== attributeSlug) continue;
      if (allowed && !allowed.includes(attribute.valueSlug)) continue;
      if (!badges.includes(attribute.value)) badges.push(attribute.value);
    }
  }
  return badges.slice(0, MAX_CARD_BADGES);
}
