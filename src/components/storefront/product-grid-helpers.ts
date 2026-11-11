export interface QuickAddPayload {
  variantId: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
}

export interface WishlistButtonLike {
  dataset: { wishlistId?: string };
  setAttribute(name: string, value: string): void;
}

/** Kart üzerindeki `data-*` niteliklerinden hızlı sepete ekleme verisini çözer. */
export function parseQuickAddDataset(dataset: {
  quickAdd?: string;
  productId?: string;
  productName?: string;
  productPrice?: string;
  productCurrency?: string;
}): QuickAddPayload | null {
  const { quickAdd, productId, productName, productPrice, productCurrency } =
    dataset;
  if (
    !quickAdd ||
    !productId ||
    !productName ||
    !productPrice ||
    !productCurrency
  ) {
    return null;
  }

  const price = Number(productPrice);
  if (!Number.isFinite(price)) return null;

  return {
    variantId: quickAdd,
    productId,
    name: productName,
    price,
    currency: productCurrency,
  };
}

/** Favori durumuna göre karttaki düğmenin erişilebilirlik niteliklerini günceller. */
export function syncWishlistButtonElement(
  button: WishlistButtonLike,
  favoriteIds: ReadonlySet<string>,
): void {
  const id = button.dataset.wishlistId;
  if (!id) return;

  const favorite = favoriteIds.has(id);
  button.setAttribute("aria-pressed", String(favorite));
  button.setAttribute(
    "aria-label",
    favorite ? "Favorilerden çıkar" : "Favorilere ekle",
  );
}
