import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb, type TestDb } from "../../../../tests/support/test-db";
import { makeOrder } from "../../../../tests/support/factories";
import { D1AdminOrderRepository } from "./admin-order.repository";

describe("Admin sipariş listesi (veritabanı)", () => {
  const tag = randomUUID().slice(0, 6).toUpperCase();
  let t: TestDb;
  let db: Db;
  let repo: D1AdminOrderRepository;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1AdminOrderRepository(() => db);
    const address = { firstName: "Ayşe", lastName: "Kaya" };
    const base = { shippingAddress: address, billingAddress: address, subtotal: "100", grandTotal: "100" };

    await makeOrder(
      db,
      { ...base, orderNumber: `S${tag}1`, guestEmail: "a@test.com", status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
      [],
      [{ provider: "manual", method: "BANK_TRANSFER", status: "PENDING", amount: "100", merchantOid: `M${tag}1` }],
    );
    await makeOrder(db, { ...base, orderNumber: `S${tag}2`, guestEmail: "b@test.com", status: "PAID", paymentStatus: "PAID" });
    await makeOrder(db, { ...base, orderNumber: `S${tag}3`, guestEmail: "c@test.com", status: "PAID", paymentStatus: "PAID" });
  });

  afterAll(() => t.close());

  it("durum bazında sayar ve aramayı uygular", async () => {
    expect(await repo.countByStatus()).toEqual({ PENDING_PAYMENT: 1, PAID: 2 });
    expect(await repo.countByStatus("b@test")).toEqual({ PAID: 1 });
  });

  it("listede son ödemenin yöntemini döner", async () => {
    const list = await repo.list({ page: 1, pageSize: 10 });
    const byNumber = Object.fromEntries(list.items.map((o) => [o.orderNumber, o]));
    expect(byNumber[`S${tag}1`]).toMatchObject({
      customerName: "Ayşe Kaya",
      paymentMethod: "BANK_TRANSFER",
    });
    expect(byNumber[`S${tag}2`]?.paymentMethod).toBeNull();
  });
});
