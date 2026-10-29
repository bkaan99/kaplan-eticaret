import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import type { CartItemRecord, CartRepository } from "../cart/cart.repository";
import { PrismaCheckoutRepository } from "./checkout.repository";

describe("PrismaCheckoutRepository", () => {
  it("loadCartLines çağrısını CartRepository.listItems metoduna delege eder", async () => {
    const mockItem: CartItemRecord = {
      variantId: "v-1",
      quantity: 2,
      customizationKey: "c-key",
      customization: { brine: "VINEGAR" },
      weightGram: 500,
      desi: 2,
      sku: "SKU-1",
      price: new Decimal("100.00"),
      currency: "TRY",
      isActive: true,
      stockQuantity: 10,
      reservedQuantity: 1,
      product: {
        id: "p-1",
        name: "Turşu Bidonu",
        slug: "tursu-bidonu",
        status: "ACTIVE",
        trackInventory: true,
        imageUrl: "/img.jpg",
        taxRate: new Decimal("0.01"),
        categoryId: "cat-1",
        desi: 2,
      },
      optionLabels: ["1 kg", "Sirke"],
    };

    const mockCartRepo: Pick<CartRepository, "listItems"> = {
      listItems: vi.fn(async () => [mockItem]),
    };

    const repo = new PrismaCheckoutRepository(
      () => ({} as any),
      mockCartRepo as CartRepository,
    );

    const lines = await repo.loadCartLines("cart-123");

    expect(mockCartRepo.listItems).toHaveBeenCalledTimes(1);
    expect(mockCartRepo.listItems).toHaveBeenCalledWith("cart-123");
    expect(lines).toHaveLength(1);
    expect(lines[0]!.variantId).toBe("v-1");
    expect(lines[0]!.product.name).toBe("Turşu Bidonu");
    expect(lines[0]!.product.taxRate.toString()).toBe("0.01");
    expect(lines[0]!.optionLabels).toEqual(["1 kg", "Sirke"]);
  });
});
