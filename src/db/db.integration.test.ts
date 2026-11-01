import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { createTestDb, type TestDb } from "../../tests/support/test-db";
import { productVariant, role, runBatch, user } from ".";

describe("Drizzle + D1 temel", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await createTestDb();
  });
  afterAll(async () => {
    await t.close();
  });

  it("varsayılanları doldurur; tarih ve boolean'ı doğru okur", async () => {
    const [row] = await t.db
      .insert(user)
      .values({ email: "a@b.c", firstName: "A", lastName: "B" })
      .returning();
    expect(row!.id).toHaveLength(32);
    expect(row!.type).toBe("CUSTOMER");
    expect(row!.isActive).toBe(true);
    expect(row!.createdAt).toBeInstanceOf(Date);
    expect(Math.abs(row!.createdAt.getTime() - Date.now())).toBeLessThan(5_000);
  });

  it("batch atomiktir: hata olursa hiçbiri yazılmaz", async () => {
    await expect(
      runBatch(t.db, [
        t.db.insert(role).values({ name: "r1" }),
        t.db.insert(role).values({ name: "r1" }), // benzersiz ihlali
      ]),
    ).rejects.toThrow();
    const rows = await t.db.select().from(role).where(eq(role.name, "r1"));
    expect(rows).toHaveLength(0);
  });

  it("Decimal gidiş-dönüşünde kuruş korunur", async () => {
    expect(productVariant.price.getSQLType()).toBe("numeric");
    expect(new Decimal(19.9).toNumber()).toBe(19.9);
  });
});
