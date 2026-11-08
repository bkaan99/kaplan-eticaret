import Decimal from "decimal.js";
import { desc } from "drizzle-orm";
import {
  order as orders,
  orderItem as orderItems,
  payment as payments,
  shipment as shipments,
} from "@/db";
import type { AddressSnapshot, NewOrder, OrderView } from "./order.types";

function toAddress(json: unknown): AddressSnapshot {
  return json as AddressSnapshot;
}

export const orderWith = {
  items: true,
  shipments: { orderBy: desc(shipments.createdAt), limit: 1 },
  payments: { orderBy: desc(payments.createdAt), limit: 1 },
} as const;

export type OrderRow = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect)[];
  shipments: (typeof shipments.$inferSelect)[];
  payments: (typeof payments.$inferSelect)[];
};

export function toView(row: OrderRow): OrderView {
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
export function orderValues(
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
