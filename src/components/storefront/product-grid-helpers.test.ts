import { describe, expect, it } from "vitest";
import {
  parseQuickAddDataset,
  syncWishlistButtonElement,
  type WishlistButtonLike,
} from "./product-grid-helpers";

function createButtonStub(id?: string): {
  button: WishlistButtonLike;
  attrs: Record<string, string>;
} {
  const attrs: Record<string, string> = {};
  return {
    attrs,
    button: {
      dataset: { wishlistId: id },
      setAttribute(name, value) {
        attrs[name] = value;
      },
    },
  };
}

describe("product-grid-helpers", () => {
  it("geçerli hızlı ekleme dataset alanlarını çözümler", () => {
    expect(
      parseQuickAddDataset({
        quickAdd: "var_1",
        productId: "prod_1",
        productName: "Kornişon Turşu",
        productPrice: "149.90",
        productCurrency: "TRY",
      }),
    ).toEqual({
      variantId: "var_1",
      productId: "prod_1",
      name: "Kornişon Turşu",
      price: 149.9,
      currency: "TRY",
    });
  });

  it("eksik veya geçersiz fiyat içeren dataset için null döner", () => {
    expect(
      parseQuickAddDataset({
        quickAdd: "var_1",
        productId: "prod_1",
        productName: "Kornişon",
        productCurrency: "TRY",
      }),
    ).toBeNull();

    expect(
      parseQuickAddDataset({
        quickAdd: "var_1",
        productId: "prod_1",
        productName: "Kornişon",
        productPrice: "abc",
        productCurrency: "TRY",
      }),
    ).toBeNull();
  });

  it("favori kimlik kümesine göre düğme aria niteliklerini senkronize eder", () => {
    const fav = createButtonStub("p1");
    const other = createButtonStub("p2");
    const ids = new Set(["p1"]);

    syncWishlistButtonElement(fav.button, ids);
    syncWishlistButtonElement(other.button, ids);

    expect(fav.attrs).toEqual({
      "aria-pressed": "true",
      "aria-label": "Favorilerden çıkar",
    });
    expect(other.attrs).toEqual({
      "aria-pressed": "false",
      "aria-label": "Favorilere ekle",
    });
  });
});
