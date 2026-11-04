import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb, type TestDb } from "../../../../tests/support/test-db";
import { makeCategory, makeProduct } from "../../../../tests/support/factories";
import { D1ProductAdminRepository } from "./product-admin.repository";

describe("Admin ürün listesi (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let repo: D1ProductAdminRepository;
  let categoryId: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1ProductAdminRepository(() => db);
    categoryId = (await makeCategory(db, { name: "K", slug: `k-${tag}` })).id;

    await makeProduct(
      db,
      { name: `Biber ${tag}`, slug: `biber-${tag}`, status: "ACTIVE", categoryId },
      [
        { sku: `B1-${tag}`, price: "150", stockQuantity: 10, reservedQuantity: 4 },
        { sku: `B3-${tag}`, price: "300", stockQuantity: 2, reservedQuantity: 2 },
        // Pasif varyant: stok ve fiyata katılmaz
        { sku: `BX-${tag}`, price: "50", stockQuantity: 99, isActive: false },
      ],
    );
    await makeProduct(
      db,
      { name: `Bidon ${tag}`, slug: `bidon-${tag}`, status: "DRAFT", categoryId, trackInventory: false },
      [{ sku: `D-${tag}`, price: "500", stockQuantity: 0 }],
    );
  });

  afterAll(() => t.close());

  it("stoku yalnızca aktif varyantlardan, rezerve düşülerek hesaplar", async () => {
    const { items } = await repo.list({ categoryId, page: 1, pageSize: 10 });
    const biber = items.find((p) => p.slug === `biber-${tag}`)!;
    expect(biber).toMatchObject({
      totalStock: 6,
      outOfStockVariants: 1,
      trackInventory: true,
      minPrice: "150.00",
      hasPriceRange: true,
      sku: `B1-${tag}`,
      variantCount: 3,
    });
    const bidon = items.find((p) => p.slug === `bidon-${tag}`)!;
    expect(bidon).toMatchObject({ trackInventory: false, hasPriceRange: false });
  });

  it("durum sayılarını arama ve kategoriye göre verir", async () => {
    expect(await repo.countByStatus({ categoryId })).toEqual({ ACTIVE: 1, DRAFT: 1 });
    expect(await repo.countByStatus({ categoryId, search: `B3-${tag}` })).toEqual({
      ACTIVE: 1,
    });
  });
});
