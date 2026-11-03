import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { cart, productVariant, type Db } from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  makeCategory,
  makeProduct,
  makeUser,
} from "../../../tests/support/factories";
import { D1CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";

describe("Cart (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let service: CartService;
  let variantId: string;
  let otherVariantId: string;
  let userId: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    service = new CartService(new D1CartRepository(() => db));

    const category = await makeCategory(db, {
      name: "Test",
      slug: `cart-test-${tag}`,
    });
    const product = await makeProduct(
      db,
      {
        name: `Sepet Ürünü ${tag}`,
        slug: `sepet-urunu-${tag}`,
        status: "ACTIVE",
        categoryId: category.id,
      },
      [
        { sku: `CART-A-${tag}`, price: "100.00", stockQuantity: 5 },
        { sku: `CART-B-${tag}`, price: "40.00", stockQuantity: 10 },
      ],
    );
    const variants = [...product.variants].sort((a, b) =>
      a.sku.localeCompare(b.sku),
    );
    variantId = variants[0]!.id;
    otherVariantId = variants[1]!.id;

    const user = await makeUser(db, {
      email: `cart-${tag}@example.com`,
      firstName: "Sepet",
      lastName: "Test",
    });
    userId = user.id;
  });

  afterAll(async () => {
    await t.close();
  });

  it("misafir sepeti oluşturur ve toplamı hesaplar", async () => {
    const result = await service.addItem(
      { userId: null, sessionToken: null },
      variantId,
      2,
    );

    expect(result.sessionToken).toBeTruthy();
    expect(result.cart).toMatchObject({ itemCount: 2, subtotal: "200.00" });
  });

  it("stoğu aşan adedi reddeder", async () => {
    await expect(
      service.addItem({ userId: null, sessionToken: null }, variantId, 6),
    ).rejects.toThrow("Stokta yalnızca 5 adet var");
  });

  it("rezervasyon stoğu satılabilirden düşer", async () => {
    await db
      .update(productVariant)
      .set({ reservedQuantity: 10 })
      .where(eq(productVariant.id, otherVariantId));

    await expect(
      service.addItem({ userId: null, sessionToken: null }, otherVariantId, 1),
    ).rejects.toThrow("stokta yok");

    await db
      .update(productVariant)
      .set({ reservedQuantity: 0 })
      .where(eq(productVariant.id, otherVariantId));
  });

  it("girişte misafir sepetini üye sepetiyle toplar ve misafir sepetini siler", async () => {
    const member = await service.addItem(
      { userId, sessionToken: null },
      variantId,
      1,
    );
    const guest = await service.addItem(
      { userId: null, sessionToken: null },
      variantId,
      2,
    );
    await service.addItem(
      { userId: null, sessionToken: guest.sessionToken! },
      otherVariantId,
      3,
    );

    const merged = await service.getCart({
      userId,
      sessionToken: guest.sessionToken!,
    });

    expect(merged.cart.id).toBe(member.cart.id);
    expect(merged.clearSessionToken).toBe(true);
    const quantities = Object.fromEntries(
      merged.cart.lines.map((line) => [line.variantId, line.quantity]),
    );
    expect(quantities).toEqual({ [variantId]: 3, [otherVariantId]: 3 });
    const [remaining] = await db
      .select({ n: count() })
      .from(cart)
      .where(eq(cart.sessionToken, guest.sessionToken!));
    expect(remaining!.n).toBe(0);
  });

  it("terk edilmiş eski anonim sepetleri ve satırlarını temizler", async () => {
    // 1. Eski anonim sepet
    const oldGuest = await service.addItem(
      { userId: null, sessionToken: null },
      variantId,
      1,
    );
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    await db
      .update(cart)
      .set({ updatedAt: sixtyDaysAgo })
      .where(eq(cart.id, oldGuest.cart.id));

    // 2. Yeni anonim sepet (dokunulmamalı)
    const freshGuest = await service.addItem(
      { userId: null, sessionToken: null },
      variantId,
      1,
    );

    // 3. Üye sepeti (dokunulmamalı)
    const userCart = await service.addItem(
      { userId, sessionToken: null },
      variantId,
      1,
    );

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const removed = await service.purgeAbandoned(cutoff);

    expect(removed).toBeGreaterThanOrEqual(1);

    // Eski anonim sepet silinmiş olmalı
    const [oldRow] = await db
      .select({ id: cart.id })
      .from(cart)
      .where(eq(cart.id, oldGuest.cart.id));
    expect(oldRow).toBeUndefined();

    // Yeni anonim sepet ve üye sepeti durmalı
    const [freshRow] = await db
      .select({ id: cart.id })
      .from(cart)
      .where(eq(cart.id, freshGuest.cart.id));
    expect(freshRow).toBeDefined();

    const [userRow] = await db
      .select({ id: cart.id })
      .from(cart)
      .where(eq(cart.id, userCart.cart.id));
    expect(userRow).toBeDefined();
  });
});
