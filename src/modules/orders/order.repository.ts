import { randomBytes, randomInt } from "node:crypto";
import Decimal from "decimal.js";
import type { Prisma } from "../../../generated/prisma/client";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { CreditLimitPolicy } from "../b2b/credit-limit.policy";
import type { PrismaClient } from "@/shared/prisma-client";
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

const orderInclude = {
  items: true,
  shipments: { orderBy: { createdAt: "desc" }, take: 1 },
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
} as const;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

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

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: () => PrismaClient) {}

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

      const updated =
        mode === "reserve"
          ? await db.$executeRaw`
          UPDATE "ProductVariant"
          SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
          WHERE "id" = ${item.variantId}
            AND "isActive" = true
            AND ("stockQuantity" - "reservedQuantity") >= ${item.quantity}`
          : await db.$executeRaw`
          UPDATE "ProductVariant"
          SET "stockQuantity" = "stockQuantity" - ${item.quantity}
          WHERE "id" = ${item.variantId}
            AND "isActive" = true
            AND ("stockQuantity" - "reservedQuantity") >= ${item.quantity}`;

      if (updated === 0) {
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
        if (mode === "reserve") {
          await db.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedQuantity" = "reservedQuantity" - ${claim.quantity}
            WHERE "id" = ${claim.variantId}`;
        } else {
          await db.$executeRaw`
            UPDATE "ProductVariant"
            SET "stockQuantity" = "stockQuantity" + ${claim.quantity}
            WHERE "id" = ${claim.variantId}`;
        }
      } catch {
        // En iyi çaba: telafi başarısız olursa rezervasyon süre aşımı işi toparlar.
      }
    }
  }

  async createPendingOrder(order: NewOrder): Promise<CreatedOrder> {
    const orderNumber = generateOrderNumber();
    const lookupToken = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + order.reservationMinutes * 60_000);

    // Stok rezervasyonu: koşullu güncelleme yarış durumunu ve fazla satışı önler.
    const claimed = await this.claimStock(order.items, "reserve");

    try {
      // Sipariş, ödeme, kalemler ve stok rezervasyonları tek (iç içe) yazımda oluşur.
      const created = await this.db().order.create({
        data: {
          orderNumber,
          lookupToken,
          userId: order.userId,
          guestEmail: order.email,
          cartId: order.cartId,
          currency: order.currency,
          subtotal: order.subtotal,
          discountTotal: order.discountTotal,
          shippingTotal: order.shippingTotal,
          taxTotal: order.taxTotal,
          grandTotal: order.grandTotal,
          couponCode: order.couponCode,
          shippingAddress:
            order.shippingAddress as unknown as Prisma.InputJsonValue,
          billingAddress:
            order.billingAddress as unknown as Prisma.InputJsonValue,
          customerNote: order.customerNote,
          items: {
            create: order.items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              customization: item.customization
                ? (item.customization as Prisma.InputJsonValue)
                : undefined,
            })),
          },
          payments: {
            create: {
              provider: order.paymentProvider,
              method: order.paymentMethod,
              amount: order.grandTotal,
              currency: order.currency,
              merchantOid: orderNumber,
            },
          },
          reservations: {
            create: order.items
              .filter((item) => item.trackInventory)
              .map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                expiresAt,
              })),
          },
        },
        select: { id: true },
      });

      return {
        orderId: created.id,
        orderNumber,
        lookupToken,
        merchantOid: orderNumber,
      };
    } catch (error) {
      await this.revertStockClaims(claimed, "reserve");
      throw error;
    }
  }

  async createDeferredOrder(
    order: NewOrder,
    terms: DeferredTerms,
  ): Promise<CreatedOrder> {
    const orderNumber = generateOrderNumber();
    const lookupToken = randomBytes(24).toString("base64url");

    if (!order.userId) {
      throw new ConflictError("Vadeli ödeme yalnızca üye bayiler içindir");
    }

    // Kredi: outstanding okunur sonra insert edilir (satır kilidi yok).
    // Eşzamanlı limit aşımı için uygulama katmanında retry gerekir.
    // Stok fazla satışı aşağıdaki koşullu UPDATE ile engellenir.
    const outstanding = await this.db().order.aggregate({
      where: {
        userId: order.userId,
        paymentStatus: "PENDING",
        status: { notIn: ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"] },
        payments: { some: { method: "DEFERRED" } },
      },
      _sum: { grandTotal: true },
    });
    CreditLimitPolicy.assertAllowed(
      outstanding._sum.grandTotal?.toString() ?? 0,
      order.grandTotal,
      terms.creditLimit,
    );

    // Vadeli siparişte stok rezerve edilmez; koşullu UPDATE fazla satışı önler.
    const claimed = await this.claimStock(order.items, "deduct");

    try {
      const db = this.db();
      const createOrder = db.order.create({
        data: {
          orderNumber,
          lookupToken,
          userId: order.userId,
          guestEmail: order.email,
          cartId: order.cartId,
          status: "PROCESSING",
          paymentStatus: "PENDING",
          currency: order.currency,
          subtotal: order.subtotal,
          discountTotal: order.discountTotal,
          shippingTotal: order.shippingTotal,
          taxTotal: order.taxTotal,
          grandTotal: order.grandTotal,
          couponCode: order.couponCode,
          shippingAddress:
            order.shippingAddress as unknown as Prisma.InputJsonValue,
          billingAddress:
            order.billingAddress as unknown as Prisma.InputJsonValue,
          customerNote: order.customerNote,
          items: {
            create: order.items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              customization: item.customization
                ? (item.customization as Prisma.InputJsonValue)
                : undefined,
            })),
          },
          payments: {
            create: {
              provider: "deferred",
              method: "DEFERRED",
              amount: order.grandTotal,
              currency: order.currency,
              merchantOid: orderNumber,
              dueAt: terms.dueAt,
            },
          },
        },
        select: { id: true },
      });

      // Sipariş + kupon sayacı + sepet temizliği: operasyonlar önceden bilinir (dizi formu).
      const ops: Prisma.PrismaPromise<unknown>[] = [createOrder];
      if (order.couponCode) {
        ops.push(
          db.coupon.updateMany({
            where: { code: order.couponCode },
            data: { usedCount: { increment: 1 } },
          }),
        );
      }
      if (order.cartId) {
        ops.push(db.cart.deleteMany({ where: { id: order.cartId } }));
      }
      const results = await db.$transaction(ops);
      const created = results[0] as { id: string };

      return {
        orderId: created.id,
        orderNumber,
        lookupToken,
        merchantOid: orderNumber,
      };
    } catch (error) {
      await this.revertStockClaims(claimed, "deduct");
      throw error;
    }
  }

  async markDeferredPaid(orderId: string): Promise<boolean> {
    const db = this.db();
    // Tahsilat talebi (idempotency kapısı): yalnızca PENDING vadeli ödeme alınır.
    const claimed = await db.payment.updateMany({
      where: { orderId, method: "DEFERRED", status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (claimed.count === 0) return false;

    try {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID" },
      });
    } catch (error) {
      // Telafi: sipariş güncellenemediyse tahsilat işaretini geri al.
      await db.payment
        .updateMany({
          where: { orderId, method: "DEFERRED", status: "PAID" },
          data: { status: "PENDING", paidAt: null },
        })
        .catch(() => undefined);
      throw error;
    }
    return true;
  }

  async findById(orderId: string): Promise<OrderView | null> {
    const row = await this.db().order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    return row ? toView(row) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderView | null> {
    const row = await this.db().order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
    return row ? toView(row) : null;
  }

  async findByLookupToken(token: string): Promise<OrderView | null> {
    const row = await this.db().order.findUnique({
      where: { lookupToken: token },
      include: orderInclude,
    });
    return row ? toView(row) : null;
  }

  async listByUser(userId: string): Promise<OrderView[]> {
    const rows = await this.db().order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
    return rows.map(toView);
  }

  async getPaymentForOrder(orderId: string) {
    const payment = await this.db().payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) return null;

    return {
      merchantOid: payment.merchantOid,
      amount: payment.amount.toFixed(2),
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      method: payment.method,
    };
  }

  async applyPaymentResult(input: PaymentResultInput): Promise<PaymentOutcome> {
    const db = this.db();
    const payment = await db.payment.findUnique({
      where: { merchantOid: input.merchantOid },
      include: { order: true },
    });
    if (!payment) return { kind: "not-found" } as const;

    // Tutar uyuşmuyor: ödeme kabul edilmez, inceleme için FAILED işaretlenir.
    const amountMismatch =
      input.success && !new Decimal(input.amount).eq(payment.amount);

    // Aynı bildirim tekrar gelirse: yalnızca PENDING ödeme işlenir (idempotent).
    const claimed = await db.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: {
        status: input.success && !amountMismatch ? "PAID" : "FAILED",
        rawPayload: input.rawPayload as Prisma.InputJsonValue,
        paidAt: input.success ? new Date() : null,
      },
    });
    if (claimed.count === 0) {
      return { kind: "already-processed", orderId: payment.orderId } as const;
    }

    const orderId = payment.orderId;
    if (amountMismatch) {
      return { kind: "amount-mismatch", orderId } as const;
    }

    try {
      const reservations = await db.stockReservation.findMany({
        where: { orderId, status: "ACTIVE" },
      });

      // Tüm operasyonlar önceden bilinir: dizi formunda tek batch.
      const ops: Prisma.PrismaPromise<unknown>[] = [];

      if (input.success) {
        for (const reservation of reservations) {
          ops.push(
            db.productVariant.update({
              where: { id: reservation.variantId },
              data: {
                stockQuantity: { decrement: reservation.quantity },
                reservedQuantity: { decrement: reservation.quantity },
              },
            }),
          );
        }
        ops.push(
          db.stockReservation.updateMany({
            where: { orderId, status: "ACTIVE" },
            data: { status: "CONSUMED" },
          }),
          db.order.update({
            where: { id: orderId },
            data: { status: "PAID", paymentStatus: "PAID" },
          }),
        );
        if (payment.order.couponCode) {
          ops.push(
            db.coupon.updateMany({
              where: { code: payment.order.couponCode },
              data: { usedCount: { increment: 1 } },
            }),
          );
        }
        if (payment.order.cartId) {
          ops.push(db.cart.deleteMany({ where: { id: payment.order.cartId } }));
        }
        await db.$transaction(ops);
        return { kind: "paid", orderId } as const;
      }

      for (const reservation of reservations) {
        ops.push(
          db.productVariant.update({
            where: { id: reservation.variantId },
            data: { reservedQuantity: { decrement: reservation.quantity } },
          }),
        );
      }
      ops.push(
        db.stockReservation.updateMany({
          where: { orderId, status: "ACTIVE" },
          data: { status: "RELEASED" },
        }),
        db.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
          },
        }),
      );
      await db.$transaction(ops);
      return { kind: "failed", orderId } as const;
    } catch (error) {
      // Telafi: sonuç uygulanamadıysa talebi geri bırak ki sağlayıcı bildirimi tekrar işlensin.
      await db.payment
        .updateMany({
          where: { id: payment.id, status: { in: ["PAID", "FAILED"] } },
          data: { status: "PENDING", paidAt: null },
        })
        .catch(() => undefined);
      throw error;
    }
  }

  async cancelOrder(orderId: string, markRefunded: boolean): Promise<void> {
    const db = this.db();
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) throw new NotFoundError("Sipariş");

    // Ödenmiş siparişte ve vadeli (stoğu doğrudan düşülmüş) siparişte stok geri yüklenir.
    const wasPaid = order.paymentStatus === "PAID";
    const stockConsumed = wasPaid || order.payments[0]?.method === "DEFERRED";

    // Tüm operasyonlar önceden bilinir: dizi formunda tek batch.
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    if (stockConsumed) {
      // Düşülmüş stok iade edilir (yalnızca stok takibi yapılan ürünler).
      const variantIds = order.items
        .map((item) => item.variantId)
        .filter((id): id is string => id !== null);
      const variants =
        variantIds.length > 0
          ? await db.productVariant.findMany({
              where: { id: { in: variantIds } },
              select: {
                id: true,
                product: { select: { trackInventory: true } },
              },
            })
          : [];
      const tracked = new Set(
        variants.filter((v) => v.product.trackInventory).map((v) => v.id),
      );
      for (const item of order.items) {
        if (!item.variantId || !tracked.has(item.variantId)) continue;
        ops.push(
          db.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          }),
        );
      }
    } else {
      const reservations = await db.stockReservation.findMany({
        where: { orderId, status: "ACTIVE" },
      });
      for (const reservation of reservations) {
        ops.push(
          db.productVariant.update({
            where: { id: reservation.variantId },
            data: { reservedQuantity: { decrement: reservation.quantity } },
          }),
        );
      }
      ops.push(
        db.stockReservation.updateMany({
          where: { orderId, status: "ACTIVE" },
          data: { status: "RELEASED" },
        }),
      );
    }

    ops.push(
      db.order.update({
        where: { id: orderId },
        data: {
          status: markRefunded ? "REFUNDED" : "CANCELLED",
          paymentStatus: markRefunded ? "REFUNDED" : order.paymentStatus,
          cancelledAt: new Date(),
        },
      }),
    );
    await db.$transaction(ops);
  }

  async recordRefund(
    orderId: string,
    amount: string,
    reason: string | null,
    providerRef: string | null,
  ): Promise<void> {
    const payment = await this.db().payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) throw new NotFoundError("Ödeme");

    await this.db().refund.create({
      data: {
        paymentId: payment.id,
        amount,
        reason,
        providerRef,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await this.db().payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });
  }

  async releaseExpired(now: Date): Promise<number> {
    const expired = await this.db().stockReservation.findMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      select: { orderId: true },
    });
    const orderIds = [
      ...new Set(
        expired.map((r) => r.orderId).filter((id): id is string => id !== null),
      ),
    ];

    let released = 0;
    for (const orderId of orderIds) {
      const order = await this.db().order.findUnique({
        where: { id: orderId },
        select: { status: true, paymentStatus: true },
      });
      // Yalnızca ödemesi hâlâ beklenen siparişler iptal edilir.
      if (
        order?.status === "PENDING_PAYMENT" &&
        order.paymentStatus === "PENDING"
      ) {
        await this.cancelOrder(orderId, false);
        await this.db().payment.updateMany({
          where: { orderId, status: "PENDING" },
          data: { status: "FAILED" },
        });
        released += 1;
      }
    }
    return released;
  }

  async countCouponUses(
    code: string,
    owner: { userId: string | null; email: string },
  ): Promise<number> {
    return this.db().order.count({
      where: {
        couponCode: code,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        OR: [
          ...(owner.userId ? [{ userId: owner.userId }] : []),
          { guestEmail: owner.email },
        ],
      },
    });
  }
}
