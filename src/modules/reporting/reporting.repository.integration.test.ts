import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  makeCategory,
  makeOrder,
  makeProduct,
} from "../../../tests/support/factories";
import { D1ReportingRepository } from "./reporting.repository";

describe("Raporlama (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  const from = new Date("2026-06-01T00:00:00Z");
  const to = new Date("2026-07-01T00:00:00Z");
  let t: TestDb;
  let db: Db;
  let repo: D1ReportingRepository;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1ReportingRepository(() => db);

    const category = await makeCategory(db, { name: "K", slug: `k-${tag}` });
    const product = await makeProduct(
      db,
      {
        name: "Bidon",
        slug: `bidon-${tag}`,
        status: "ACTIVE",
        categoryId: category.id,
      },
      [{ sku: `B-${tag}`, price: "300", stockQuantity: 10 }],
    );
    const variantId = product.variants[0]!.id;
    const address = { firstName: "Ali" };
    const jar = (quantity: number, names: string[]) => ({
      variantId,
      productName: "Kendi Turşunu Yap",
      sku: `B-${tag}`,
      unitPrice: "300.00",
      taxRate: "1.00",
      quantity,
      lineTotal: (300 * quantity).toFixed(2),
      customization: {
        kind: "custom-pickle",
        ingredients: names.map((name, i) => ({
          id: `i${i}`,
          name,
          unitExtra: "0",
        })),
        brine: "VINEGAR",
        spice: "MILD",
        note: null,
      },
    });

    const base = { shippingAddress: address, billingAddress: address };
    await makeOrder(
      db,
      {
        ...base,
        status: "PAID",
        paymentStatus: "PAID",
        subtotal: "600",
        grandTotal: "600",
        createdAt: new Date("2026-06-10T10:00:00Z"),
      },
      [jar(2, ["Salatalık", "Biber"])],
    );
    // İptal edilen sipariş rapora girmez.
    await makeOrder(
      db,
      {
        ...base,
        status: "CANCELLED",
        paymentStatus: "PENDING",
        subtotal: "300",
        grandTotal: "300",
        createdAt: new Date("2026-06-11T10:00:00Z"),
      },
      [jar(1, ["Lahana"])],
    );
    // Dönem dışı sipariş rapora girmez.
    await makeOrder(
      db,
      {
        ...base,
        status: "DELIVERED",
        paymentStatus: "PAID",
        subtotal: "300",
        grandTotal: "300",
        createdAt: new Date("2026-05-01T10:00:00Z"),
      },
      [jar(1, ["Havuç"])],
    );
  });

  afterAll(() => t.close());

  it("dönemdeki geçerli siparişlerin ciro satırlarını döner", async () => {
    const rows = await repo.revenueRows(from, to);
    expect(rows.map((row) => row.grandTotal.toString())).toEqual(["600"]);
  });

  it("turşu satırlarının malzeme kopyasını JSON olarak okur", async () => {
    const rows = await repo.ingredientUsage(from, to);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      quantity: 2,
      customization: {
        kind: "custom-pickle",
        ingredients: [{ name: "Salatalık" }, { name: "Biber" }],
      },
    });
  });
});
