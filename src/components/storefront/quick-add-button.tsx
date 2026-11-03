"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/app/(storefront)/sepet/actions";
import { trackEvent } from "@/shared/analytics/client";
import { BagIcon } from "./icons";
import { refreshStorefrontShell } from "./shell-events";

/** Tek seçenekli ürünü ürün sayfasına gitmeden sepete ekler. */
export function QuickAddButton({
  variantId,
  product,
  className,
}: {
  variantId: string;
  product: { id: string; name: string; price: string; currency: string };
  className: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "added" | "error">("idle");

  function add() {
    startTransition(async () => {
      const result = await addToCartAction(variantId, 1);
      setState(result.ok ? "added" : "error");
      if (result.ok) {
        refreshStorefrontShell();
        const price = Number(product.price);
        trackEvent("add_to_cart", {
          currency: product.currency,
          value: price,
          item: { id: product.id, name: product.name, price, quantity: 1 },
        });
      }
      setTimeout(() => setState("idle"), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      className={className}
    >
      <BagIcon width={16} height={16} />
      <span aria-live="polite">
        {pending
          ? "Ekleniyor…"
          : state === "added"
            ? "Sepete eklendi"
            : state === "error"
              ? "Eklenemedi"
              : "Sepete Ekle"}
      </span>
    </button>
  );
}
