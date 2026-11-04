import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { address, type Db } from "@/db";
import { createTestDb, type TestDb } from "../../../../tests/support/test-db";
import {
  insertRow,
  makeOrder,
  makeUser,
} from "../../../../tests/support/factories";
import { D1CustomerQueryRepository } from "./customer-query.repository";

describe("Admin müşteri sorguları (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let repo: D1CustomerQueryRepository;
  let buyerId: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1CustomerQueryRepository(() => db);
    const person = (first: string, verified: boolean) => ({
      email: `${first.toLowerCase()}-${tag}@test.com`,
      passwordHash: "x",
      firstName: first,
      lastName: tag,
      type: "CUSTOMER" as const,
      emailVerifiedAt: verified ? new Date() : null,
    });

    const buyer = await makeUser(db, person("Alici", true), true);
    buyerId = buyer.id;
    await makeUser(db, person("Yeni", false), true);
    const cancelled = await makeUser(db, person("Iptal", true), true);

    const address0 = { firstName: "Alici" };
    const order = (
      userId: string,
      status: "PAID" | "DELIVERED" | "CANCELLED",
      total: string,
      at: string,
    ) =>
      makeOrder(db, {
        userId,
        status,
        paymentStatus: status === "CANCELLED" ? "PENDING" : "PAID",
        subtotal: total,
        grandTotal: total,
        shippingAddress: address0,
        billingAddress: address0,
        createdAt: new Date(at),
      });
    await order(buyerId, "DELIVERED", "100.10", "2026-10-01T10:00:00Z");
    await order(buyerId, "PAID", "49.90", "2026-11-02T10:00:00Z");
    await order(buyerId, "CANCELLED", "999", "2026-11-03T10:00:00Z");
    // Yalnızca iptal siparişi olan müşteri "alışveriş yapan" sayılmaz.
    await order(cancelled.id, "CANCELLED", "50", "2026-11-01T10:00:00Z");

    await insertRow(db, address, {
      userId: buyerId,
      title: "Ev",
      firstName: "Alici",
      lastName: tag,
      phone: "0532",
      city: "Ankara",
      district: "Çankaya",
      addressLine: "Cad. 1",
      isDefaultShipping: true,
    });
  });

  afterAll(() => t.close());

  it("segment sayılarını hesaplar (iptal siparişi alışveriş sayılmaz)", async () => {
    expect(await repo.segmentCounts(tag)).toEqual({
      all: 3,
      buyers: 1,
      "no-orders": 2,
      unverified: 1,
    });
  });

  it("segmente göre listeler ve harcama/son siparişi verir", async () => {
    const { items } = await repo.search({
      search: tag,
      segment: "buyers",
      page: 1,
      pageSize: 10,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: buyerId,
      orderCount: 2,
      totalSpent: "150.00",
      lastOrderAt: new Date("2026-11-02T10:00:00Z"),
    });
  });

  it("detayda adresleri ve tüm siparişleri döner", async () => {
    const detail = await repo.findById(buyerId);
    expect(detail?.orders).toHaveLength(3);
    expect(detail?.addresses).toEqual([
      expect.objectContaining({
        title: "Ev",
        city: "Ankara",
        isDefaultShipping: true,
      }),
    ]);
  });
});
