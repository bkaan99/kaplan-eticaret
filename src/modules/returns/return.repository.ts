import Decimal from "decimal.js";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  newId,
  order as orders,
  orderItem as orderItems,
  payment as payments,
  productVariant as variants,
  refund as refunds,
  returnRequest as returnRequests,
  returnRequestItem as returnRequestItems,
  runBatch,
  type Db,
} from "@/db";
import { NotFoundError } from "@/shared/errors";
import type { ReturnStatus } from "./return.types";

export interface ReturnOrderRecord {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  grandTotal: Decimal;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  items: {
    id: string;
    productName: string;
    variantName: string | null;
    unitPrice: Decimal;
    quantity: number;
  }[];
}

export interface ReturnRequestRecord {
  id: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  adminNote: string | null;
  createdAt: Date;
  order: {
    id: string;
    orderNumber: string;
    email: string;
    subtotal: Decimal;
    discountTotal: Decimal;
    grandTotal: Decimal;
    merchantOid: string | null;
  };
  items: {
    orderItemId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    unitPrice: Decimal;
    quantity: number;
    trackInventory: boolean;
  }[];
}

export interface ReturnRepository {
  findOrder(orderNumber: string): Promise<ReturnOrderRecord | null>;
  /** İptal edilmemiş (reddedilmemiş) taleplerde ürün başına iade istenen adet. */
  requestedQuantities(orderId: string): Promise<Map<string, number>>;
  createRequest(
    orderId: string,
    data: {
      reason: string;
      note: string | null;
      items: { orderItemId: string; quantity: number }[];
    },
  ): Promise<string>;
  list(status?: ReturnStatus): Promise<ReturnRequestRecord[]>;
  get(requestId: string): Promise<ReturnRequestRecord | null>;
  reject(requestId: string, adminNote: string | null): Promise<boolean>;
  /** Talebi tamamlar, iade kaydı açar, isteğe bağlı stoğu geri yükler. */
  complete(
    requestId: string,
    data: { amount: string; providerRef: string | null; restock: boolean },
  ): Promise<void>;
}

/** İade talebi görünümü için ilişkili kayıtlar. */
const requestWith = {
  order: {
    with: { payments: { orderBy: desc(payments.createdAt), limit: 1 } },
  },
  items: {
    with: {
      orderItem: {
        with: {
          variant: { with: { product: { columns: { trackInventory: true } } } },
        },
      },
    },
  },
} as const;

export class D1ReturnRepository implements ReturnRepository {
  constructor(private readonly db: () => Db) {}

  async findOrder(orderNumber: string): Promise<ReturnOrderRecord | null> {
    const row = await this.db().query.order.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      with: {
        items: true,
        shipments: {
          orderBy: (shipment, { desc }) => desc(shipment.createdAt),
          limit: 1,
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      email: row.guestEmail ?? "",
      status: row.status,
      paymentStatus: row.paymentStatus,
      subtotal: row.subtotal,
      discountTotal: row.discountTotal,
      grandTotal: row.grandTotal,
      createdAt: row.createdAt,
      shippedAt: row.shipments[0]?.shippedAt ?? null,
      deliveredAt: row.shipments[0]?.deliveredAt ?? null,
      items: row.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    };
  }

  async requestedQuantities(orderId: string): Promise<Map<string, number>> {
    const rows = await this.db()
      .select({
        orderItemId: returnRequestItems.orderItemId,
        quantity: returnRequestItems.quantity,
      })
      .from(returnRequestItems)
      .innerJoin(
        returnRequests,
        eq(returnRequests.id, returnRequestItems.returnRequestId),
      )
      .where(
        and(
          eq(returnRequests.orderId, orderId),
          ne(returnRequests.status, "REJECTED"),
        ),
      );

    const totals = new Map<string, number>();
    for (const row of rows) {
      totals.set(
        row.orderItemId,
        (totals.get(row.orderItemId) ?? 0) + row.quantity,
      );
    }
    return totals;
  }

  async createRequest(
    orderId: string,
    data: {
      reason: string;
      note: string | null;
      items: { orderItemId: string; quantity: number }[];
    },
  ): Promise<string> {
    const db = this.db();
    const id = newId();
    // Talep ve kalemleri tek batch'te (atomik).
    await runBatch(db, [
      db
        .insert(returnRequests)
        .values({ id, orderId, reason: data.reason, note: data.note }),
      ...data.items.map((item) =>
        db.insert(returnRequestItems).values({ returnRequestId: id, ...item }),
      ),
    ]);
    return id;
  }

  private async toRecord(id: string): Promise<ReturnRequestRecord | null> {
    const row = await this.db().query.returnRequest.findFirst({
      where: eq(returnRequests.id, id),
      with: requestWith,
    });
    if (!row) return null;
    return this.map(row);
  }

  private map(row: {
    id: string;
    status: string;
    reason: string;
    note: string | null;
    adminNote: string | null;
    createdAt: Date;
    order: {
      id: string;
      orderNumber: string;
      guestEmail: string | null;
      subtotal: Decimal;
      discountTotal: Decimal;
      grandTotal: Decimal;
      payments: { merchantOid: string }[];
    };
    items: {
      orderItemId: string;
      quantity: number;
      orderItem: {
        variantId: string | null;
        productName: string;
        variantName: string | null;
        unitPrice: Decimal;
        variant: { product: { trackInventory: boolean } } | null;
      };
    }[];
  }): ReturnRequestRecord {
    return {
      id: row.id,
      status: row.status as ReturnStatus,
      reason: row.reason,
      note: row.note,
      adminNote: row.adminNote,
      createdAt: row.createdAt,
      order: {
        id: row.order.id,
        orderNumber: row.order.orderNumber,
        email: row.order.guestEmail ?? "",
        subtotal: row.order.subtotal,
        discountTotal: row.order.discountTotal,
        grandTotal: row.order.grandTotal,
        merchantOid: row.order.payments[0]?.merchantOid ?? null,
      },
      items: row.items.map((item) => ({
        orderItemId: item.orderItemId,
        variantId: item.orderItem.variantId,
        productName: item.orderItem.productName,
        variantName: item.orderItem.variantName,
        unitPrice: item.orderItem.unitPrice,
        quantity: item.quantity,
        trackInventory: item.orderItem.variant?.product.trackInventory ?? false,
      })),
    };
  }

  async list(status?: ReturnStatus): Promise<ReturnRequestRecord[]> {
    const rows = await this.db().query.returnRequest.findMany({
      where: status ? eq(returnRequests.status, status) : undefined,
      orderBy: desc(returnRequests.createdAt),
      limit: 200,
      with: requestWith,
    });
    return rows.map((row) => this.map(row));
  }

  get(requestId: string): Promise<ReturnRequestRecord | null> {
    return this.toRecord(requestId);
  }

  async reject(requestId: string, adminNote: string | null): Promise<boolean> {
    const result = await this.db()
      .update(returnRequests)
      .set({ status: "REJECTED", adminNote, resolvedAt: new Date() })
      .where(
        and(
          eq(returnRequests.id, requestId),
          eq(returnRequests.status, "REQUESTED"),
        ),
      )
      .run();
    return result.meta.changes > 0;
  }

  async complete(
    requestId: string,
    data: { amount: string; providerRef: string | null; restock: boolean },
  ): Promise<void> {
    const db = this.db();
    const request = await db.query.returnRequest.findFirst({
      where: eq(returnRequests.id, requestId),
      with: {
        items: { with: { orderItem: true } },
        order: {
          with: { payments: { orderBy: desc(payments.createdAt), limit: 1 } },
        },
      },
    });
    if (!request) throw new NotFoundError("İade talebi");

    // İdempotency kapısı: yalnızca REQUESTED talep tamamlanır.
    const claimed = await db
      .update(returnRequests)
      .set({ status: "COMPLETED", resolvedAt: new Date() })
      .where(
        and(
          eq(returnRequests.id, requestId),
          eq(returnRequests.status, "REQUESTED"),
        ),
      )
      .run();
    if (claimed.meta.changes === 0) return;

    try {
      // Tüm işlemler önceden bilinir: tek batch (atomik).
      const ops: Parameters<typeof runBatch>[1] = [];

      const payment = request.order.payments[0];
      if (payment) {
        const previous = await db
          .select({ amount: refunds.amount })
          .from(refunds)
          .where(
            and(
              eq(refunds.paymentId, payment.id),
              eq(refunds.status, "COMPLETED"),
            ),
          );
        // Toplama JS'te Decimal ile yapılır: SQL SUM kayan nokta hatası üretebilir.
        const total = previous
          .reduce((sum, row) => sum.plus(row.amount), new Decimal(0))
          .plus(data.amount);
        const full = total.gte(payment.amount);

        ops.push(
          db.insert(refunds).values({
            paymentId: payment.id,
            amount: new Decimal(data.amount),
            reason: `İade talebi: ${request.reason}`,
            providerRef: data.providerRef,
            status: "COMPLETED",
            completedAt: new Date(),
          }),
          db
            .update(payments)
            .set({ status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" })
            .where(eq(payments.id, payment.id)),
          db
            .update(orders)
            .set({
              paymentStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED",
              ...(full ? { status: "REFUNDED" as const } : {}),
            })
            .where(eq(orders.id, request.orderId)),
        );
      }

      if (data.restock) {
        const variantIds = request.items
          .map((item) => item.orderItem.variantId)
          .filter((id): id is string => id !== null);
        const known =
          variantIds.length > 0
            ? await db.query.productVariant.findMany({
                where: inArray(variants.id, variantIds),
                columns: { id: true },
                with: { product: { columns: { trackInventory: true } } },
              })
            : [];
        const tracked = new Set(
          known.filter((v) => v.product.trackInventory).map((v) => v.id),
        );
        for (const item of request.items) {
          const variantId = item.orderItem.variantId;
          if (!variantId || !tracked.has(variantId)) continue;
          ops.push(
            db
              .update(variants)
              .set({
                stockQuantity: sql`${variants.stockQuantity} + ${item.quantity}`,
              })
              .where(eq(variants.id, variantId)),
          );
        }
      }

      await runBatch(db, ops);
    } catch (error) {
      // Telafi: iade yazılamadıysa talebi tekrar işlenebilir hale getir.
      await db
        .update(returnRequests)
        .set({ status: "REQUESTED", resolvedAt: null })
        .where(
          and(
            eq(returnRequests.id, requestId),
            eq(returnRequests.status, "COMPLETED"),
          ),
        )
        .catch(() => undefined);
      throw error;
    }
  }
}
