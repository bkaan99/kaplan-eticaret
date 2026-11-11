"use client";

import { useSyncExternalStore } from "react";
import { HeartIcon } from "@/components/storefront/icons";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleWishlist,
} from "./wishlist-store";

export function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorite = state.ids.has(productId);

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={() => void toggleWishlist(productId)}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background ${className}`}
    >
      <HeartIcon
        width={18}
        height={18}
        strokeWidth={2}
        fill={favorite ? "currentColor" : "none"}
      />
    </button>
  );
}
