"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
} from "react";
import { addToCartAction } from "@/app/(storefront)/sepet/actions";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleWishlist,
} from "@/components/wishlist/wishlist-store";
import { trackEvent } from "@/shared/analytics/client";
import { refreshStorefrontShell } from "./shell-events";
import {
  parseQuickAddDataset,
  syncWishlistButtonElement,
} from "./product-grid-helpers";

const QUICK_ADD_RESET_MS = 2000;
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Grid kartlarındaki sepete ekle ve favori etkileşimlerini tek client sınırında toplar. */
export function ProductGridInteractions({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Map<HTMLButtonElement, number>>(new Map());
  const wishlist = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useIsomorphicLayoutEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    container
      .querySelectorAll<HTMLButtonElement>("[data-wishlist-id]")
      .forEach((button) => syncWishlistButtonElement(button, wishlist.ids));
  }, [wishlist.ids, children]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  async function handleQuickAdd(button: HTMLButtonElement): Promise<void> {
    if (button.disabled) return;
    const payload = parseQuickAddDataset(button.dataset);
    if (!payload) return;

    const existingTimer = timersRef.current.get(button);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(button);
    }

    const label = button.querySelector<HTMLElement>("[data-quick-add-label]");
    button.disabled = true;
    if (label) label.textContent = "Ekleniyor…";

    let status: "added" | "error" = "error";
    try {
      const result = await addToCartAction(payload.variantId, 1);
      if (result.ok) {
        status = "added";
        refreshStorefrontShell();
        trackEvent("add_to_cart", {
          currency: payload.currency,
          value: payload.price,
          item: {
            id: payload.productId,
            name: payload.name,
            price: payload.price,
            quantity: 1,
          },
        });
      }
    } catch {
      status = "error";
    } finally {
      button.disabled = false;
      if (button.isConnected && label?.isConnected) {
        label.textContent =
          status === "added" ? "Sepete eklendi" : "Eklenemedi";
        const timerId = window.setTimeout(() => {
          timersRef.current.delete(button);
          if (label.isConnected) label.textContent = "Sepete Ekle";
        }, QUICK_ADD_RESET_MS);
        timersRef.current.set(button, timerId);
      }
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const wishlistButton =
      target.closest<HTMLButtonElement>("[data-wishlist-id]");
    if (wishlistButton?.dataset.wishlistId) {
      void toggleWishlist(wishlistButton.dataset.wishlistId);
      return;
    }

    const quickAddButton =
      target.closest<HTMLButtonElement>("[data-quick-add]");
    if (quickAddButton) {
      void handleQuickAdd(quickAddButton);
    }
  }

  return (
    <div ref={gridRef} onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
