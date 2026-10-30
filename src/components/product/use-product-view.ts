"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addToCartAction } from "@/app/(storefront)/sepet/actions";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import {
  defaultSelection,
  findVariant,
  imagesForSelection,
  type Selection,
} from "@/modules/catalog/variant-selection";
import { trackEvent } from "@/shared/analytics/client";

const MAX_QUANTITY = 99;

export function discountPercent(price: string, compareAt: string | null): number | null {
  if (!compareAt) return null;
  const current = Number(price);
  const original = Number(compareAt);
  if (!(original > current)) return null;
  return Math.round((1 - current / original) * 100);
}

export function useProductView(product: ProductDetail) {
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(product.variants, product.options),
  );
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const variant = useMemo(
    () => findVariant(product.variants, product.options, selection),
    [product, selection],
  );

  const images = useMemo(
    () => imagesForSelection(product.images, selection),
    [product.images, selection],
  );

  const image = images[Math.min(imageIndex, images.length - 1)]!;

  const maxQuantity = Math.min(
    variant?.availableQuantity ?? MAX_QUANTITY,
    MAX_QUANTITY,
  );

  const canBuy = product.priceVisible && variant !== null && variant.inStock;
  const discount = variant
    ? discountPercent(variant.price, variant.compareAtPrice)
    : null;

  function select(optionId: string, valueId: string) {
    setSelection((current) => ({ ...current, [optionId]: valueId }));
    setImageIndex(0);
    setQuantity(1);
    setMessage(null);
  }

  function changeQuantity(next: number) {
    setQuantity(Math.min(Math.max(1, next || 1), maxQuantity));
  }

  function addToCart() {
    if (!variant) return;

    startTransition(async () => {
      const result = await addToCartAction(variant.id, quantity);
      if (!result.ok) {
        setMessage({ text: result.error ?? "Sepete eklenemedi", error: true });
        return;
      }

      setMessage({ text: "Ürün sepete eklendi", error: false });
      setJustAdded(true);
      const unit = Number(variant.price);
      trackEvent("add_to_cart", {
        currency: variant.currency,
        value: unit * quantity,
        item: {
          id: product.id,
          name: product.name,
          price: unit,
          quantity,
          variant: variant.sku,
          brand: product.brand?.name ?? null,
        },
      });
    });
  }

  return {
    selection,
    quantity,
    imageIndex,
    setImageIndex,
    message,
    pending,
    justAdded,
    variant,
    images,
    image,
    maxQuantity,
    canBuy,
    discount,
    select,
    changeQuantity,
    addToCart,
  };
}

export type ProductViewState = ReturnType<typeof useProductView>;
