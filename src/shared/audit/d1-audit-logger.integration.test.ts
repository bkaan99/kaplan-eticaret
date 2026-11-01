import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { auditLog } from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import { D1AuditLogger } from "./d1-audit-logger";

describe("D1AuditLogger", () => {
  let t: TestDb;
  let logger: D1AuditLogger;

  beforeAll(async () => {
    t = await createTestDb();
    logger = new D1AuditLogger(t.db);
  });

  afterAll(async () => {
    await t.close();
  });

  const countBy = async (entityId: string) =>
    (await t.db.select({ n: count() }).from(auditLog).where(eq(auditLog.entityId, entityId)))[0]!.n;

  it("eski ve yeni değerlerle kayıt yazar", async () => {
    const entityId = randomUUID();

    await logger.log({
      actorId: null,
      action: "product.price.update",
      entityType: "Product",
      entityId,
      before: { price: "100.00" },
      after: { price: "120.00" },
      ip: "127.0.0.1",
    });

    const [row] = await t.db.select().from(auditLog).where(eq(auditLog.entityId, entityId));
    expect(row!.action).toBe("product.price.update");
    expect(row!.before).toEqual({ price: "100.00" });
    expect(row!.after).toEqual({ price: "120.00" });
    expect(row!.ip).toBe("127.0.0.1");
  });

  it("saklama süresi dolan kayıtları siler, yenileri korur", async () => {
    const oldId = randomUUID();
    const freshId = randomUUID();

    await t.db.insert(auditLog).values({
      action: "test.old",
      entityType: "Test",
      entityId: oldId,
      createdAt: new Date("2020-01-01T00:00:00Z"),
    });
    await logger.log({
      actorId: null,
      action: "test.fresh",
      entityType: "Test",
      entityId: freshId,
    });

    await logger.purgeOlderThan(new Date("2021-01-01T00:00:00Z"));

    expect(await countBy(oldId)).toBe(0);
    expect(await countBy(freshId)).toBe(1);
  });
});
