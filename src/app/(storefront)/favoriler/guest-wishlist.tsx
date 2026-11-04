"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ProductGrid } from "@/components/storefront/product-grid";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/components/wishlist/wishlist-store";
import type { ProductCard } from "@/modules/catalog/catalog.types";
import { getWishlistCardsAction } from "./actions";
import { EmptyWishlist } from "./empty-wishlist";

/** Misafir favorileri tarayıcıda tutulur; ürün kartları sunucudan çekilir. */
export function GuestWishlist() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [cards, setCards] = useState<ProductCard[] | null>(null);
  const key = [...state.ids].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];

    if (ids.length === 0) return;

    void getWishlistCardsAction(ids).then((result) => {
      if (!cancelled) setCards(result);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  if (key !== "" && cards === null) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (key === "" || cards === null || cards.length === 0) {
    return <EmptyWishlist />;
  }

  return <ProductGrid products={cards} />;
}
