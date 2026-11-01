import { randomBytes, randomInt } from "node:crypto";
import Decimal from "decimal.js";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { CreditLimitPolicy } from "../b2b/credit-limit.policy";
import {
  and,
  count,
  desc,
  eq,
  exists,
  gt,
  inArray,
  lt,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  cart as carts,
  coupon as coupons,
  newId,
  order as orders,
  orderItem as orderItems,
  payment as payments,
  productVariant as variants,
  refund as refunds,
  runBatch,
  shipment as shipments,
  stockReservation as reservations,
  type Db,
} from "@/db";
import type {
  AddressSnapshot,
  CreatedOrder,
  NewOrder,
  OrderView,
  PaymentOutcome,
} from "./order.types";

export interface PaymentResultInput {
  merchantOid: string;
  success: boolean;
  /** Sağlayıcının bildirdiği tutar (ondalık string) */
  amount: string;
  failureReason: string | null;
  rawPayload: Record<string, string>;
}

export interface DeferredTerms {
  /** Bayinin kredi limiti (ondalık string) */
  creditLimit: string;
  dueAt: Date;
}

/**
 * Sipariş kimliği ile tekil sipariş sorgulama sözleşmesi (ISP - Interface Segregation).
 */
export interface OrderLookupRepository {
  findById(orderId: string): Promise<OrderView | null>;
}

/**
 * Sipariş okuma ve sorgulama işlemleri sözleşmesi.
 */
export interface OrderQueryRepository extends OrderLookupRepository {
  findByOrderNumber(orderNumber: string): Promise<OrderView | null>;
  findByLookupToken(token: string): Promise<OrderView | null>;
  listByUser(userId: string): Promise<OrderView[]>;
  getPaymentForOrder(orderId: string): Promise<{
    merchantOid: string;
    amount: string;
    currency: string;
    status: string;
    provider: string;
    method: "CARD" | "BANK_TRANSFER" | "DEFERRED";
  } | null>;
}

/**
 * Yeni sipariş oluşturma sözleşmesi (Checkout için).
 */
export interface OrderCreationRepository {
  createPendingOrder(order: NewOrder): Promise<CreatedOrder>;
  /**
   * Vadeli ödemeli siparişi oluşturur: kredi limiti okunur, stok koşullu
   * UPDATE ile düşülür, sipariş aynı akışta yazılır.
   * Stok fazla satışı WHERE available >= qty ile engellenir.
   * Kredi limiti için satır kilidi yok; gerçek serileştirme için
   * uygulama katmanında çakışma/retry gerekir.
   */
  createDeferredOrder(
    order: NewOrder,
    terms: DeferredTerms,
  ): Promise<CreatedOrder>;
}

/**
 * Sipariş yaşam döngüsü komutları (oluşturma ve iptal).
 */
export interface OrderCommandRepository extends OrderCreationRepository {
  /** Siparişi iptal eder; stoğu/rezervasyonu geri alır. İade ayrı yapılır. */
  cancelOrder(orderId: string, markRefunded: boolean): Promise<void>;
}

/**
 * Ödeme doğrulama ve tahsilat sözleşmesi.
 */
export interface OrderPaymentRepository {
  applyPaymentResult(input: PaymentResultInput): Promise<PaymentOutcome>;
  /** Vadeli siparişin tahsil edildiğini işaretler; zaten ödenmişse false döner. */
  markDeferredPaid(orderId: string): Promise<boolean>;
}

/**
 * Sipariş iade kayıt sözleşmesi.
 */
export interface OrderRefundRepository {
  recordRefund(
    orderId: string,
    amount: string,
    reason: string | null,
    providerRef: string | null,
  ): Promise<void>;
}

/**
 * Zaman aşımına uğrayan rezervasyonları serbest bırakma sözleşmesi (Worker için).
 */
export interface OrderReservationRepository {
  /** Süresi dolan rezervasyonları bırakır ve ödemesi bekleyen siparişleri iptal eder. */
  releaseExpired(now: Date): Promise<number>;
}

/**
 * Kupon kullanım sayılarını denetleme sözleşmesi.
 */
export interface CouponUsageRepository {
  countCouponUses(
    code: string,
    owner: { userId: string | null; email: string },
  ): Promise<number>;
}

/**
 * Tüm sipariş işlemlerini kapsayan birleşik (composite) repository arayüzü.
 * Tekil sorumluluklar için istemciler amaca yönelik alt arayüzleri tercih etmelidir (ISP).
 */
export interface OrderRepository
  extends
    OrderQueryRepository,
    OrderCommandRepository,
    OrderPaymentRepository,
    OrderRefundRepository,
    OrderReservationRepository,
    CouponUsageRepository {}

interface StockClaim {
  variantId: string;
  quantity: number;
}

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderNumber(): string {
  let value = "S";
  for (let i = 0; i < 10; i += 1) {
    value += ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)];
  }
  return value;
}

function toAddress(json: unknown): AddressSnapshot {
  return json as AddressSnapshot;
}

const orderWith = {
  items: true,
  shipments: { orderBy: desc(shipments.createdAt), limit: 1 },
  payments: { orderBy: desc(payments.createdAt), limit: 1 },
} as const;

type OrderRow = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect)[];
  shipments: (typeof shipments.$inferSelect)[];
  payments: (typeof payments.$inferSelect)[];
};

function toView(row: OrderRow): OrderView {
  const shipment = row.shipments[0];

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    lookupToken: row.lookupToken,
    status: row.status,
    paymentStatus: row.paymentStatus,
    email: row.guestEmail ?? "",
    currency: row.currency,
    subtotal: row.subtotal.toFixed(2),
    discountTotal: row.discountTotal.toFixed(2),
    shippingTotal: row.shippingTotal.toFixed(2),
    taxTotal: row.taxTotal.toFixed(2),
    grandTotal: row.grandTotal.toFixed(2),
    couponCode: row.couponCode,
    shippingAddress: toAddress(row.shippingAddress),
    billingAddress: toAddress(row.billingAddress),
    customerNote: row.customerNote,
    items: row.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      unitPrice: item.unitPrice.toFixed(2),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toFixed(2),
      customization: item.customization,
    })),
    trackingNumber: shipment?.trackingNumber ?? null,
    carrier: shipment?.carrier ?? null,
    createdAt: row.createdAt,
    userId: row.userId,
    paymentMethod: row.payments[0]?.method ?? "CARD",
    paymentDueAt: row.payments[0]?.dueAt ?? null,
  };
}

/** Sipariş ve ödeme kayıtlarındaki JSON/Decimal alanlarıyla birlikte yazılacak sipariş satırı. */
function orderValues(
  order: NewOrder,
  ids: { orderId: string; orderNumber: string; lookupToken: string },
) {
  return {
    id: ids.orderId,
    orderNumber: ids.orderNumber,
    lookupToken: ids.lookupToken,
    userId: order.userId,
    guestEmail: order.email,
    cartId: order.cartId,
    currency: order.currency,
    subtotal: new Decimal(order.subtotal),
    discountTotal: new Decimal(order.discountTotal),
    shippingTotal: new Decimal(order.shippingTotal),
    taxTotal: new Decimal(order.taxTotal),
    grandTotal: new Decimal(order.grandTotal),
    couponCode: order.couponCode,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    customerNote: order.customerNote,
  };
}

export class D1OrderRepository implements OrderRepository {
  constructor(private readonly db: () => Db) {}

  /**
   * Koşullu UPDATE ile stok rezerve eder (rezervasyon: reservedQuantity artar,
   * vadeli: stockQuantity doğrudan düşer). Yarıda hata olursa o ana kadar
   * alınanlar geri verilir (interaktif transaction yok).
   */
  private async claimStock(
    items: NewOrder["items"],
    mode: "reserve" | "deduct",
  ): Promise<StockClaim[]> {
    const claimed: StockClaim[] = [];
    const db = this.db();

    for (const item of items) {
      if (!item.trackInventory) continue;

      const result = await db
        .update(variants)
        .set(
          mode === "reserve"
            ? {
                reservedQuantity: sql`${variants.reservedQuantity} + ${item.quantity}`,
              }
            : {
                stockQuantity: sql`${variants.stockQuantity} - ${item.quantity}`,
              },
        )
        .where(
          and(
            eq(variants.id, item.variantId),
            eq(variants.isActive, true),
            sql`(${variants.stockQuantity} - ${variants.reservedQuantity}) >= ${item.quantity}`,
          ),
        )
        .run();

      if (result.meta.changes === 0) {
        await this.revertStockClaims(claimed, mode);
        throw new ConflictError(`"${item.productName}" için yeterli stok yok`);
      }
      claimed.push({ variantId: item.variantId, quantity: item.quantity });
    }
    return claimed;
  }

  /** Alınmış stok hakkını geri verir; telafi hatası asıl hatayı gizlemez. */
  private async revertStockClaims(
    claims: StockClaim[],
    mode: "reserve" | "deduct",
  ): Promise<void> {
    const db = this.db();
    for (const claim of claims) {
      try {
        await db
          .update(variants)
          .set(
            mode === "reserve"
              ? {
                  reservedQuantity: sql`${variants.reservedQuantity} - ${claim.quantity}`,
                }
              : {
                  stockQuantity: sql`${variants.stockQuantity} + ${claim.quantity}`,
                },
          )
          .where(eq(variants.id, claim.variantId));
      } catch {
        // En iyi çaba: telafi başarısız olursa rezervasyon süre aşımı işi toparlar.
      }
    }
  }

  /** Sipariş kalemleri: satır başına ekleme (D1 sorgu başına 100 parametre sınırı). */
  private itemInserts(db: Db, orderId: string, items: NewOrder["items"]) {
    return items.map((item) =>
      db.insert(orderItems).values({
        orderId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        unitPrice: new Decimal(item.unitPrice),
        taxRate: new Decimal(item.taxRate),
        quantity: item.quantity,
        lineTotal: new Decimal(item.lineTotal),
        customization: item.customization ?? undefined,
      }),
    );
  }

  async createPendingOrder(order: NewOrder): Promise<CreatedOrder> {
    const orderNumber = generateOrderNumber();
    const lookupToken = randomBytes(24).toString("base64url");
    const orderId = newId();
    const expiresAt = new Date(Date.now() + order.reservationMinutes * 60_000);

    // Stok rezervasyonu: koşullu güncelleme yarış durumunu ve fazla satışı önler.
    const claimed = await this.claimStock(order.items, "reserve");

    try {
      const db = this.db();
      // Sipariş, ödeme, kalemler ve stok rezervasyonları tek batch'te (atomik) oluşur.
      await runBatch(db, [
        db
          .insert(orders)
          .values(orderValues(order, { orderId, orderNumber, lookupToken })),
        ...this.itemInserts(db, orderId, order.items),
        db.insert(payments).values({
          orderId,
          provider: order.paymentProvider,
          method: order.paymentMethod,
          amount: new Decimal(order.grandTotal),
          currency: order.currency,
          merchantOid: orderNumber,
        }),
        ...order.items
          .filter((item) => item.trackInventory)
          .map((item) =>
            db.insert(reservations).values({
              orderId,
              variantId: item.variantId,
              quantity: item.quantity,
              expiresAt,
            }),
          ),
      ]);

      return { orderId, orderNumber, lookupToken, merchantOid: orderNumber };
    } catch (error) {
      await this.revertStockClaims(claimed, "reserve");
      throw error;
    }
  }

  /** Ödenmemiş vadeli sipariş toplamı (kredi kullanımı); toplama Decimal ile JS'te yapılır. */
  private async outstandingDeferred(userId: string): Promise<Decimal> {
    const db = this.db();
    const rows = await db
      .select({ grandTotal: orders.grandTotal })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.paymentStatus, "PENDING"),
          notInArray(orders.status, [
            "CANCELLED",
            "REFUNDED",
            "PENDING_PAYMENT",
          ]),
          exists(
            db
              .select({ one: payments.id })
              .from(payments)
              .where(
                and(
                  eq(payments.orderId, orders.id),
                  eq(payments.method, "DEFERRED"),
                ),
              ),
          ),
        ),
      );
    return rows.reduce(
      (total, row) => total.plus(row.grandTotal),
      new Decimal(0),
    );
  }

  async createDeferredOrder(
    order: NewOrder,
    terms: DeferredTerms,
  ): Promise<CreatedOrder> {
    const orderNumber = generateOrderNumber();
    const lookupToken = randomBytes(24).toString("base64url");
    const orderId = newId();

    if (!order.userId) {
      throw new ConflictError("Vadeli ödeme yalnızca üye bayiler içindir");
    }

    // Kredi: outstanding okunur sonra insert edilir (satır kilidi yok).
    // Eşzamanlı limit aşımı için uygulama katmanında retry gerekir.
    // Stok fazla satışı aşağıdaki koşullu UPDATE ile engellenir.
    const outstanding = await this.outstandingDeferred(order.userId);
    CreditLimitPolicy.assertAllowed(
      outstanding.toString(),
      order.grandTotal,
      terms.creditLimit,
    );

    // Vadeli siparişte stok rezerve edilmez; koşullu UPDATE fazla satışı önler.
    const claimed = await this.claimStock(order.items, "deduct");

    try {
      const db = this.db();
      // Sipariş + ödeme + kalemler + kupon sayacı + sepet temizliği tek batch'te (atomik).
      await runBatch(db, [
        db.insert(orders).values({
          ...orderValues(order, { orderId, orderNumber, lookupToken }),
          status: "PROCESSING",
          paymentStatus: "PENDING",
        }),
        ...this.itemInserts(db, orderId, order.items),
        db.insert(payments).values({
          orderId,
          provider: "deferred",
          method: "DEFERRED",
          amount: new Decimal(order.grandTotal),
          currency: order.currency,
          merchantOid: orderNumber,
          dueAt: terms.dueAt,
        }),
        ...(order.couponCode
          ? [
              db
                .update(coupons)
                .set({ usedCount: sql`${coupons.usedCount} + 1` })
                .where(eq(coupons.code, order.couponCode)),
            ]
          : []),
        ...(order.cartId
          ? [db.delete(carts).where(eq(carts.id, order.cartId))]
          : []),
      ]);

      return { orderId, orderNumber, lookupToken, merchantOid: orderNumber };
    } catch (error) {
      await this.revertStockClaims(claimed, "deduct");
      throw error;
    }
  }

  async markDeferredPaid(orderId: string): Promise<boolean> {
    const db = this.db();
    // Tahsilat talebi (idempotency kapısı): yalnızca PENDING vadeli ödeme alınır.
    const claimed = await db
      .update(payments)
      .set({ status: "PAID", paidAt: new Date() })
      .where(
        and(
          eq(payments.orderId, orderId),
          eq(payments.method, "DEFERRED"),
          eq(payments.status, "PENDING"),
        ),
      )
      .run();
    if (claimed.meta.changes === 0) return false;

    try {
      await db
        .update(orders)
        .set({ paymentStatus: "PAID" })
        .where(eq(orders.id, orderId));
    } catch (error) {
      // Telafi: sipariş güncellenemediyse tahsilat işaretini geri al.
      await db
        .update(payments)
        .set({ status: "PENDING", paidAt: null })
        .where(
          and(
            eq(payments.orderId, orderId),
            eq(payments.method, "DEFERRED"),
            eq(payments.status, "PAID"),
          ),
        )
        .catch(() => undefined);
      throw error;
    }
    return true;
  }

  private async findOne(
    where: ReturnType<typeof eq>,
  ): Promise<OrderView | null> {
    const row = await this.db().query.order.findFirst({
      where,
      with: orderWith,
    });
    return row ? toView(row) : null;
  }

  findById(orderId: string): Promise<OrderView | null> {
    return this.findOne(eq(orders.id, orderId));
  }

  findByOrderNumber(orderNumber: string): Promise<OrderView | null> {
    return this.findOne(eq(orders.orderNumber, orderNumber));
  }

  findByLookupToken(token: string): Promise<OrderView | null> {
    return this.findOne(eq(orders.lookupToken, token));
  }

  async listByUser(userId: string): Promise<OrderView[]> {
    const rows = await this.db().query.order.findMany({
      where: eq(orders.userId, userId),
      orderBy: desc(orders.createdAt),
      with: orderWith,
    });
    return rows.map(toView);
  }

  async getPaymentForOrder(orderId: string) {
    const [row] = await this.db()
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    if (!row) return null;

    return {
      merchantOid: row.merchantOid,
      amount: row.amount.toFixed(2),
      currency: row.currency,
      status: row.status,
      provider: row.provider,
      method: row.method,
    };
  }

  async applyPaymentResult(input: PaymentResultInput): Promise<PaymentOutcome> {
    const db = this.db();
    const found = await db.query.payment.findFirst({
      where: eq(payments.merchantOid, input.merchantOid),
      with: { order: true },
    });
    if (!found) return { kind: "not-found" } as const;

    // Tutar uyuşmuyor: ödeme kabul edilmez, inceleme için FAILED işaretlenir.
    const amountMismatch =
      input.success && !new Decimal(input.amount).eq(found.amount);

    // Aynı bildirim tekrar gelirse: yalnızca PENDING ödeme işlenir (idempotent).
    const claimed = await db
      .update(payments)
      .set({
        status: input.success && !amountMismatch ? "PAID" : "FAILED",
        rawPayload: input.rawPayload,
        paidAt: input.success ? new Date() : null,
      })
      .where(and(eq(payments.id, found.id), eq(payments.status, "PENDING")))
      .run();
    if (claimed.meta.changes === 0) {
      return { kind: "already-processed", orderId: found.orderId } as const;
    }

    const orderId = found.orderId;
    if (amountMismatch) {
      return { kind: "amount-mismatch", orderId } as const;
    }

    try {
      const active = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.orderId, orderId),
            eq(reservations.status, "ACTIVE"),
          ),
        );

      if (input.success) {
        await runBatch(db, [
          ...active.map((reservation) =>
            db
              .update(variants)
              .set({
                stockQuantity: sql`${variants.stockQuantity} - ${reservation.quantity}`,
                reservedQuantity: sql`${variants.reservedQuantity} - ${reservation.quantity}`,
              })
              .where(eq(variants.id, reservation.variantId)),
          ),
          db
            .update(reservations)
            .set({ status: "CONSUMED" })
            .where(
              and(
                eq(reservations.orderId, orderId),
                eq(reservations.status, "ACTIVE"),
              ),
            ),
          db
            .update(orders)
            .set({ status: "PAID", paymentStatus: "PAID" })
            .where(eq(orders.id, orderId)),
          ...(found.order.couponCode
            ? [
                db
                  .update(coupons)
                  .set({ usedCount: sql`${coupons.usedCount} + 1` })
                  .where(eq(coupons.code, found.order.couponCode)),
              ]
            : []),
          ...(found.order.cartId
            ? [db.delete(carts).where(eq(carts.id, found.order.cartId))]
            : []),
        ]);
        return { kind: "paid", orderId } as const;
      }

      await runBatch(db, [
        ...active.map((reservation) =>
          db
            .update(variants)
            .set({
              reservedQuantity: sql`${variants.reservedQuantity} - ${reservation.quantity}`,
            })
            .where(eq(variants.id, reservation.variantId)),
        ),
        db
          .update(reservations)
          .set({ status: "RELEASED" })
          .where(
            and(
              eq(reservations.orderId, orderId),
              eq(reservations.status, "ACTIVE"),
            ),
          ),
        db
          .update(orders)
          .set({
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      ]);
      return { kind: "failed", orderId } as const;
    } catch (error) {
      // Telafi: sonuç uygulanamadıysa talebi geri bırak ki sağlayıcı bildirimi tekrar işlensin.
      await db
        .update(payments)
        .set({ status: "PENDING", paidAt: null })
        .where(
          and(
            eq(payments.id, found.id),
            inArray(payments.status, ["PAID", "FAILED"]),
          ),
        )
        .catch(() => undefined);
      throw error;
    }
  }

  async cancelOrder(orderId: string, markRefunded: boolean): Promise<void> {
    const db = this.db();
    const found = await db.query.order.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        payments: { orderBy: desc(payments.createdAt), limit: 1 },
      },
    });
    if (!found) throw new NotFoundError("Sipariş");

    // Ödenmiş siparişte ve vadeli (stoğu doğrudan düşülmüş) siparişte stok geri yüklenir.
    const wasPaid = found.paymentStatus === "PAID";
    const stockConsumed = wasPaid || found.payments[0]?.method === "DEFERRED";

    // Tüm operasyonlar önceden bilinir: tek batch (atomik).
    const ops: Parameters<typeof runBatch>[1] = [];

    if (stockConsumed) {
      // Düşülmüş stok iade edilir (yalnızca stok takibi yapılan ürünler).
      const variantIds = found.items
        .map((item) => item.variantId)
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
      for (const item of found.items) {
        if (!item.variantId || !tracked.has(item.variantId)) continue;
        ops.push(
          db
            .update(variants)
            .set({
              stockQuantity: sql`${variants.stockQuantity} + ${item.quantity}`,
            })
            .where(eq(variants.id, item.variantId)),
        );
      }
    } else {
      const active = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.orderId, orderId),
            eq(reservations.status, "ACTIVE"),
          ),
        );
      for (const reservation of active) {
        ops.push(
          db
            .update(variants)
            .set({
              reservedQuantity: sql`${variants.reservedQuantity} - ${reservation.quantity}`,
            })
            .where(eq(variants.id, reservation.variantId)),
        );
      }
      ops.push(
        db
          .update(reservations)
          .set({ status: "RELEASED" })
          .where(
            and(
              eq(reservations.orderId, orderId),
              eq(reservations.status, "ACTIVE"),
            ),
          ),
      );
    }

    ops.push(
      db
        .update(orders)
        .set({
          status: markRefunded ? "REFUNDED" : "CANCELLED",
          paymentStatus: markRefunded ? "REFUNDED" : found.paymentStatus,
          cancelledAt: new Date(),
        })
        .where(eq(orders.id, orderId)),
    );
    await runBatch(db, ops);
  }

  async recordRefund(
    orderId: string,
    amount: string,
    reason: string | null,
    providerRef: string | null,
  ): Promise<void> {
    const db = this.db();
    const [row] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    if (!row) throw new NotFoundError("Ödeme");

    // İade kaydı ve ödeme durumu birlikte (atomik) yazılır.
    await runBatch(db, [
      db.insert(refunds).values({
        paymentId: row.id,
        amount: new Decimal(amount),
        reason,
        providerRef,
        status: "COMPLETED",
        completedAt: new Date(),
      }),
      db
        .update(payments)
        .set({ status: "REFUNDED" })
        .where(eq(payments.id, row.id)),
    ]);
  }

  async releaseExpired(now: Date): Promise<number> {
    const db = this.db();
    const expired = await db
      .select({ orderId: reservations.orderId })
      .from(reservations)
      .where(
        and(eq(reservations.status, "ACTIVE"), lt(reservations.expiresAt, now)),
      );
    const orderIds = [
      ...new Set(
        expired.map((r) => r.orderId).filter((id): id is string => id !== null),
      ),
    ];

    let released = 0;
    for (const orderId of orderIds) {
      const [row] = await db
        .select({ status: orders.status, paymentStatus: orders.paymentStatus })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      // Yalnızca ödemesi hâlâ beklenen siparişler iptal edilir.
      if (
        row?.status === "PENDING_PAYMENT" &&
        row.paymentStatus === "PENDING"
      ) {
        await this.cancelOrder(orderId, false);
        await db
          .update(payments)
          .set({ status: "FAILED" })
          .where(
            and(eq(payments.orderId, orderId), eq(payments.status, "PENDING")),
          );
        released += 1;
      }
    }
    return released;
  }

  async countCouponUses(
    code: string,
    owner: { userId: string | null; email: string },
  ): Promise<number> {
    const [row] = await this.db()
      .select({ n: count() })
      .from(orders)
      .where(
        and(
          eq(orders.couponCode, code),
          notInArray(orders.status, ["CANCELLED", "REFUNDED"]),
          or(
            owner.userId ? eq(orders.userId, owner.userId) : undefined,
            eq(orders.guestEmail, owner.email),
          ),
        ),
      );
    return row!.n;
  }
}
