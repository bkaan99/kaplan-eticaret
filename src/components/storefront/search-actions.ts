"use server";

import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import type { ProductCard } from "@/modules/catalog/catalog.types";

export interface LiveSearchResult {
  items: ProductCard[];
  total: number;
}

/**
 * Navbar canlı arama aksiyonu.
 * 2 harften kısa aramalar sunucuyu yormadan hemen boş döner.
 */
export async function liveSearchAction(term: string): Promise<LiveSearchResult> {
  const query = term.trim();
  if (query.length < 2) {
    return { items: [], total: 0 };
  }

  const pricing = await getRequestPricing();
  return catalogService.searchQuick(query, 5, pricing);
}
