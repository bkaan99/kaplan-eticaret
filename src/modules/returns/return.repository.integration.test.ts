import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import {
  order as orderTable,
  orderItem,
  payment,
  refund,
  returnRequest,
  type Db,
} from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  makeCategory,
  makeOrder,
  makeProduct,
  variantById,
} from "../../../tests/support/factories";
import { D1ReturnRepository } from "./return.repository";

describe("D1ReturnRepository", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let repo: D1ReturnRepository;
  let variantId: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1ReturnRepository(() => db);

    const category = await makeCategory(db, {
      name: "İade",
      slug: `return-${tag}`,
    });
    const product = await makeProduct(
      db,
      {
        name: `İade Ürünü ${tag}`,
        slug: `iade-urunu-${tag}`,
        status: "ACTIVE",
        categoryId: category.id,
      },
      [{ sku: `RET-${tag}`, price: "100.00", stockQuantity: 5 }],
    );
    variantId = product.variants[0]!.id;
  });

  afterAll(async () => {
    await t.close();
  });

  async function createDeliveredOrder() {
    const orderNumber = `R${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const id = await makeOrder(
      db,
      {
        orderNumber,
        guestEmail: `iade-${tag}@example.com`,
        status: "DELIVERED",
        paymentStatus: "PAID",
        subtotal: "300.00",
        grandTotal: "300.00",
        shippingAddress: {},
        billingAddress: {},
      },
      [
        {
          variantId,
          productName: "İade Ürünü",
          sku: `RET-${tag}`,
          unitPrice: "100.00",
          taxRate: "20.00",
          quantity: 3,
          lineTotal: "300.00",
        },
      ],
      [
        {
          provider: "dev",
          amount: "300.00",
          merchantOid: orderNumber,
          status: "PAID",
        },
      ],
    );
    const items = await db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, id));
    return { id, items };
  }

  it("talep oluşturur ve istenen adetleri toplar (reddedilenler hariç)", async () => {
    const order = await createDeliveredOrder();
    const itemId = order.items[0]!.id;

    const first = await repo.createRequest(order.id, {
      reason: "Beden",
      note: null,
      items: [{ orderItemId: itemId, quantity: 1 }],
    });
    await repo.createRequest(order.id, {
      reason: "Hasarlı",
      note: null,
      items: [{ orderItemId: itemId, quantity: 1 }],
    });

    expect((await repo.requestedQuantities(order.id)).get(itemId)).toBe(2);

    await repo.reject(first, "Kullanılmış");
    expect((await repo.requestedQuantities(order.id)).get(itemId)).toBe(1);
  });

  it("kısmi iadeyi tamamlar: ödeme PARTIALLY_REFUNDED olur, stok geri yüklenir", async () => {
    const order = await createDeliveredOrder();
    const itemId = order.items[0]!.id;
    const before = await variantById(db, variantId);

    const requestId = await repo.createRequest(order.id, {
      reason: "Beden",
      note: null,
      items: [{ orderItemId: itemId, quantity: 1 }],
    });

    await repo.complete(requestId, {
      amount: "100.00",
      providerRef: "ref",
      restock: true,
    });

    const after = await variantById(db, variantId);
    expect(after.stockQuantity).toBe(before.stockQuantity + 1);

    const [updated] = (await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, order.id))) as [typeof orderTable.$inferSelect];
    expect(updated.paymentStatus).toBe("PARTIALLY_REFUNDED");
    expect(updated.status).toBe("DELIVERED");

    const [request] = (await db
      .select()
      .from(returnRequest)
      .where(eq(returnRequest.id, requestId))) as [
      typeof returnRequest.$inferSelect,
    ];
    expect(request.status).toBe("COMPLETED");
  });

  it("tam tutar iade edilince sipariş REFUNDED olur; ikinci tamamlama etkisizdir", async () => {
    const order = await createDeliveredOrder();
    const itemId = order.items[0]!.id;

    const requestId = await repo.createRequest(order.id, {
      reason: "Hepsi",
      note: null,
      items: [{ orderItemId: itemId, quantity: 3 }],
    });

    await repo.complete(requestId, {
      amount: "300.00",
      providerRef: null,
      restock: false,
    });
    await repo.complete(requestId, {
      amount: "300.00",
      providerRef: null,
      restock: false,
    });

    const [updated] = (await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, order.id))) as [typeof orderTable.$inferSelect];
    expect(updated.status).toBe("REFUNDED");
    expect(updated.paymentStatus).toBe("REFUNDED");
    const [refunds] = await db
      .select({ n: count() })
      .from(refund)
      .innerJoin(payment, eq(payment.id, refund.paymentId))
      .where(eq(payment.orderId, order.id));
    expect(refunds!.n).toBe(1);
  });
});
