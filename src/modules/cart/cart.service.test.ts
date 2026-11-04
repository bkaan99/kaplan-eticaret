import Decimal from "decimal.js";
import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "@/shared/errors";
import type { ItemCustomizationHandler } from "./customization";
import type {
  CartItemRecord,
  CartRecord,
  CartRepository,
  VariantStockRecord,
} from "./cart.repository";
import { CartService } from "./cart.service";

interface FakeVariant {
  price: string;
  isActive?: boolean;
  productActive?: boolean;
  trackInventory?: boolean;
  stock?: number;
  reserved?: number;
}

class FakeCartRepository implements CartRepository {
  carts = new Map<string, CartRecord>();
  items = new Map<string, Map<string, number>>();
  variants = new Map<string, FakeVariant>();
  customLines = new Map<string, { key: string; customization: unknown }>();
  private seq = 0;

  async findByUserId(userId: string) {
    return [...this.carts.values()].find((c) => c.userId === userId) ?? null;
  }
  async findByToken(token: string) {
    return (
      [...this.carts.values()].find((c) => c.sessionToken === token) ?? null
    );
  }
  async create(data: { userId?: string; sessionToken?: string }) {
    const cart: CartRecord = {
      id: `cart-${++this.seq}`,
      userId: data.userId ?? null,
      sessionToken: data.sessionToken ?? null,
    };
    this.carts.set(cart.id, cart);
    this.items.set(cart.id, new Map());
    return cart;
  }
  async delete(cartId: string) {
    this.carts.delete(cartId);
    this.items.delete(cartId);
  }
  async listItems(cartId: string): Promise<CartItemRecord[]> {
    return [...(this.items.get(cartId) ?? new Map())].map(
      ([variantId, quantity]) => {
        const v = this.variants.get(variantId)!;
        const custom = this.customLines.get(`${cartId}:${variantId}`);
        return {
          variantId,
          quantity,
          customizationKey: custom?.key,
          customization: custom?.customization,
          sku: `SKU-${variantId}`,
          price: new Decimal(v.price),
          currency: "TRY",
          isActive: v.isActive ?? true,
          stockQuantity: v.stock ?? 100,
          reservedQuantity: v.reserved ?? 0,
          product: {
            id: `p-${variantId}`,
            name: `Ürün ${variantId}`,
            slug: `urun-${variantId}`,
            status: v.productActive === false ? "DRAFT" : "ACTIVE",
            trackInventory: v.trackInventory ?? true,
            imageUrl: null,
          },
          optionLabels: [],
        };
      },
    );
  }
  async getItemQuantity(cartId: string, variantId: string) {
    return this.items.get(cartId)?.get(variantId) ?? 0;
  }
  async setItemQuantity(
    cartId: string,
    variantId: string,
    quantity: number,
    custom?: { key: string; customization: unknown },
  ) {
    this.items.get(cartId)!.set(variantId, quantity);
    if (custom) {
      this.customLines.set(`${cartId}:${variantId}`, custom);
    }
  }
  async removeItem(cartId: string, variantId: string) {
    this.items.get(cartId)?.delete(variantId);
  }
  async findVariantStock(
    variantId: string,
  ): Promise<VariantStockRecord | null> {
    const v = this.variants.get(variantId);
    if (!v) return null;
    return {
      variantId,
      isActive: v.isActive ?? true,
      productActive: v.productActive ?? true,
      trackInventory: v.trackInventory ?? true,
      stockQuantity: v.stock ?? 100,
      reservedQuantity: v.reserved ?? 0,
    };
  }
  async moveItems(from: string, to: string, max: number) {
    const source = this.items.get(from) ?? new Map();
    const target = this.items.get(to)!;
    for (const [variantId, quantity] of source) {
      target.set(
        variantId,
        Math.min(max, quantity + (target.get(variantId) ?? 0)),
      );
    }
    await this.delete(from);
  }
  async purgeAbandoned(olderThan: Date) {
    let count = 0;
    for (const [id, cart] of this.carts) {
      if (!cart.userId) {
        this.carts.delete(id);
        this.items.delete(id);
        count++;
      }
    }
    return count;
  }
}

const guest = (token: string | null = null) => ({
  userId: null,
  sessionToken: token,
});

describe("CartService", () => {
  let repo: FakeCartRepository;
  let service: CartService;

  beforeEach(() => {
    repo = new FakeCartRepository();
    repo.variants.set("a", { price: "100", stock: 5 });
    repo.variants.set("b", { price: "50.50", stock: 10 });
    service = new CartService(repo);
  });

  it("misafir için sepet ve belirteç oluşturur", async () => {
    const result = await service.addItem(guest(), "a", 2);

    expect(result.sessionToken).toBeTruthy();
    expect(result.cart.itemCount).toBe(2);
    expect(result.cart.subtotal).toBe("200.00");
  });

  it("aynı ürünü eklerken adetleri toplar", async () => {
    const first = await service.addItem(guest(), "a", 1);
    const second = await service.addItem(guest(first.sessionToken!), "a", 2);

    expect(second.cart.lines[0]!.quantity).toBe(3);
    expect(second.sessionToken).toBeUndefined();
  });

  it("stoğu aşan eklemeyi reddeder", async () => {
    await expect(service.addItem(guest(), "a", 6)).rejects.toThrow(
      "Stokta yalnızca 5 adet var",
    );
  });

  it("rezerve edilen stoğu satılabilir saymaz", async () => {
    repo.variants.set("a", { price: "100", stock: 5, reserved: 5 });
    await expect(service.addItem(guest(), "a", 1)).rejects.toThrow(
      "stokta yok",
    );
  });

  it("stok takibi yoksa sınırsız ekler", async () => {
    repo.variants.set("a", { price: "100", trackInventory: false, stock: 0 });
    const result = await service.addItem(guest(), "a", 50);
    expect(result.cart.itemCount).toBe(50);
  });

  it("pasif varyant ve taslak ürünü reddeder", async () => {
    repo.variants.set("a", { price: "100", isActive: false });
    repo.variants.set("b", { price: "100", productActive: false });

    await expect(service.addItem(guest(), "a", 1)).rejects.toThrow(
      "Ürün bulunamadı",
    );
    await expect(service.addItem(guest(), "b", 1)).rejects.toThrow(
      "Ürün bulunamadı",
    );
  });

  it("geçersiz adedi reddeder", async () => {
    await expect(service.addItem(guest(), "a", 0)).rejects.toThrow(
      "Geçersiz adet",
    );
    await expect(service.addItem(guest(), "a", 1.5)).rejects.toThrow(
      "Geçersiz adet",
    );
    await expect(service.addItem(guest(), "a", 100)).rejects.toThrow(
      "Geçersiz adet",
    );
  });

  it("adedi 0 yapınca satırı siler", async () => {
    const added = await service.addItem(guest(), "a", 2);
    const result = await service.setQuantity(guest(added.sessionToken), "a", 0);

    expect(result.cart.lines).toHaveLength(0);
  });

  it("stoğu biten satırı sorunlu işaretler ve toplama katmaz", async () => {
    const added = await service.addItem(guest(), "a", 2);
    await service.addItem(guest(added.sessionToken), "b", 1);
    repo.variants.set("a", { price: "100", stock: 0 });

    const { cart } = await service.getCart(guest(added.sessionToken));

    expect(cart.hasIssues).toBe(true);
    expect(cart.lines.find((l) => l.variantId === "a")!.issue).toBe(
      "OUT_OF_STOCK",
    );
    expect(cart.subtotal).toBe("50.50");
  });

  it("adet stoğu aşarsa QUANTITY_REDUCED işaretler", async () => {
    const added = await service.addItem(guest(), "a", 5);
    repo.variants.set("a", { price: "100", stock: 3 });

    const { cart } = await service.getCart(guest(added.sessionToken));
    expect(cart.lines[0]).toMatchObject({
      issue: "QUANTITY_REDUCED",
      availableQuantity: 3,
    });
  });

  it("sepeti olmayan ziyaretçiye boş sepet döner", async () => {
    const { cart } = await service.getCart(guest());
    expect(cart).toMatchObject({ id: null, itemCount: 0, subtotal: "0.00" });
  });

  describe("üye girişinde birleştirme", () => {
    it("üyenin sepeti yoksa misafir sepeti devredilir", async () => {
      const added = await service.addItem(guest(), "a", 2);

      const result = await service.getCart({
        userId: "u1",
        sessionToken: added.sessionToken!,
      });

      expect(result.cart.itemCount).toBe(2);
      expect(result.clearSessionToken).toBe(true);
      expect(await repo.findByToken(added.sessionToken!)).toBeNull();
    });

    it("üyenin sepetiyle toplar", async () => {
      const member = await service.addItem(
        { userId: "u1", sessionToken: null },
        "a",
        1,
      );
      const added = await service.addItem(guest(), "a", 2);
      await service.addItem(guest(added.sessionToken), "b", 1);

      const result = await service.getCart({
        userId: "u1",
        sessionToken: added.sessionToken!,
      });

      expect(result.cart.id).toBe(member.cart.id);
      const quantities = Object.fromEntries(
        result.cart.lines.map((l) => [l.variantId, l.quantity]),
      );
      expect(quantities).toEqual({ a: 3, b: 1 });
    });
  });

  describe("Ürün Özelleştirme (ItemCustomizationHandler / OCP)", () => {
    const fakeCustomizationHandler: ItemCustomizationHandler = {
      isCustomizable: (slug) => slug === "ozellestirilebilir-urun",
      getStandardAddErrorMessage: (slug) => `${slug} için malzeme seçmelisiniz`,
      validateCustomItem: (slug, custom) => {
        if (slug !== "ozellestirilebilir-urun")
          throw new ValidationError("Bu ürün özelleştirilemez");
        if (!custom || typeof custom !== "object")
          throw new ValidationError("Geçersiz seçim");
      },
      quote: async (lines) => {
        return lines.map((l) => {
          if (!l.customization) return undefined;
          return {
            extra: new Decimal("15.00"),
            available: true,
            summary: "Özel Karışım",
            snapshot: { note: "özel" },
          };
        });
      },
    };

    it("özelleştirilebilir ürün standart addItem ile eklenemez", async () => {
      repo.variants.set("custom-v1", { price: "100", stock: 10 });
      const origFind = repo.findVariantStock.bind(repo);
      repo.findVariantStock = async (id) => {
        const res = await origFind(id);
        if (id === "custom-v1" && res) {
          return { ...res, productSlug: "ozellestirilebilir-urun" };
        }
        return res;
      };

      const customService = new CartService(
        repo,
        undefined,
        fakeCustomizationHandler,
      );

      await expect(
        customService.addItem(guest(), "custom-v1", 1),
      ).rejects.toThrow("ozellestirilebilir-urun için malzeme seçmelisiniz");
    });

    it("özel ürün addCustomItem ile sepete eklenir ve fiyatlandırılır", async () => {
      repo.variants.set("custom-v1", { price: "100", stock: 10 });
      const origFind = repo.findVariantStock.bind(repo);
      repo.findVariantStock = async (id) => {
        const res = await origFind(id);
        if (id === "custom-v1" && res) {
          return { ...res, productSlug: "ozellestirilebilir-urun" };
        }
        return res;
      };

      const customService = new CartService(
        repo,
        undefined,
        fakeCustomizationHandler,
      );
      const result = await customService.addCustomItem(
        guest(),
        "custom-v1",
        { key: "custom-key-1", customization: { blend: "mix" } },
        2,
      );

      expect(result.cart.lines).toHaveLength(1);
      expect(result.cart.lines[0]!.isCustom).toBe(true);
      expect(result.cart.lines[0]!.lineKey).toBe("custom-key-1");
      expect(result.cart.lines[0]!.unitPrice).toBe("115.00");
      expect(result.cart.lines[0]!.variantLabel).toContain("Özel Karışım");
      expect(result.cart.subtotal).toBe("230.00");
    });

    it("özelleştirme işleyicisi yokken addCustomItem reddedilir", async () => {
      repo.variants.set("custom-v1", { price: "100", stock: 10 });
      const standardService = new CartService(repo);
      await expect(
        standardService.addCustomItem(
          guest(),
          "custom-v1",
          { key: "custom-key-1", customization: { blend: "mix" } },
          1,
        ),
      ).rejects.toThrow("Bu ürün özelleştirilemez");
    });

    it("terk edilmiş anonim sepetleri temizler, üye sepetlerine dokunmaz", async () => {
      const guestCart = await service.addItem(guest(), "a", 1);
      const userCart = await service.addItem(
        { userId: "u-1", sessionToken: null },
        "a",
        1,
      );

      expect(repo.carts.size).toBe(2);

      const removed = await service.purgeAbandoned(new Date());
      expect(removed).toBe(1);
      expect(repo.carts.has(guestCart.cart.id!)).toBe(false);
      expect(repo.carts.has(userCart.cart.id!)).toBe(true);
    });
  });
});
