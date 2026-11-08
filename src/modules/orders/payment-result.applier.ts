import Decimal from "decimal.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  cart as carts,
  coupon as coupons,
  order as orders,
  payment as payments,
  productVariant as variants,
  runBatch,
  stockReservation as reservations,
  type Db,
} from "@/db";
import { judgePaymentResult } from "./payment-result.policy";
import type { PaymentResultInput } from "./order.repository";
import type { PaymentOutcome } from "./order.types";

/**
 * Sağlayıcı ödeme bildirimini siparişe uygular (idempotent, tek batch).
 * Karar kuralı `payment-result.policy.ts` içindedir; burada yalnızca yazma işlemleri vardır.
 */
export class PaymentResultApplier {
  constructor(private readonly db: () => Db) {}

  async apply(input: PaymentResultInput): Promise<PaymentOutcome> {
    const db = this.db();
    const found = await db.query.payment.findFirst({
      where: eq(payments.merchantOid, input.merchantOid),
      with: { order: true },
    });
    if (!found) return { kind: "not-found" } as const;

    // Tutar uyuşmuyor: ödeme kabul edilmez, inceleme için FAILED işaretlenir.
    const verdict = judgePaymentResult(
      input.success,
      new Decimal(input.amount).eq(found.amount),
    );
    const amountMismatch = verdict === "amount-mismatch";

    // Aynı bildirim tekrar gelirse: yalnızca PENDING ödeme işlenir (idempotent).
    const claimed = await db
      .update(payments)
      .set({
        status: verdict === "paid" ? "PAID" : "FAILED",
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
}
