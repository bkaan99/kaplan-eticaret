import Decimal from "decimal.js";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decimal, json, newId, timestamp } from "../types";

export const order = sqliteTable(
  "Order",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    orderNumber: text("orderNumber").notNull().unique(),
    userId: text("userId"),
    guestEmail: text("guestEmail"),
    lookupToken: text("lookupToken").notNull().unique(),
    status: text("status", {
      enum: [
        "PENDING_PAYMENT",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
    })
      .notNull()
      .default("PENDING_PAYMENT"),
    paymentStatus: text("paymentStatus", {
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
    })
      .notNull()
      .default("PENDING"),
    source: text("source").notNull().default("web"),
    currency: text("currency").notNull().default("TRY"),
    subtotal: decimal("subtotal").notNull(),
    discountTotal: decimal("discountTotal").notNull().default(new Decimal(0)),
    shippingTotal: decimal("shippingTotal").notNull().default(new Decimal(0)),
    taxTotal: decimal("taxTotal").notNull().default(new Decimal(0)),
    grandTotal: decimal("grandTotal").notNull(),
    couponCode: text("couponCode"),
    shippingAddress: json("shippingAddress").notNull(),
    billingAddress: json("billingAddress").notNull(),
    customerNote: text("customerNote"),
    cartId: text("cartId"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("Order_userId_idx").on(t.userId),
    index("Order_guestEmail_idx").on(t.guestEmail),
    index("Order_status_idx").on(t.status),
    index("Order_createdAt_idx").on(t.createdAt),
  ],
);

export const orderItem = sqliteTable(
  "OrderItem",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    orderId: text("orderId").notNull(),
    variantId: text("variantId"),
    productName: text("productName").notNull(),
    variantName: text("variantName"),
    sku: text("sku").notNull(),
    unitPrice: decimal("unitPrice").notNull(),
    taxRate: decimal("taxRate").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: decimal("lineTotal").notNull(),
    customization: json("customization"),
  },
  (t) => [index("OrderItem_orderId_idx").on(t.orderId)],
);

export const payment = sqliteTable(
  "Payment",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    orderId: text("orderId").notNull(),
    provider: text("provider").notNull(),
    method: text("method", { enum: ["CARD", "BANK_TRANSFER", "DEFERRED"] })
      .notNull()
      .default("CARD"),
    status: text("status", {
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
    })
      .notNull()
      .default("PENDING"),
    amount: decimal("amount").notNull(),
    currency: text("currency").notNull().default("TRY"),
    merchantOid: text("merchantOid").notNull().unique(),
    providerRef: text("providerRef"),
    rawPayload: json("rawPayload"),
    paidAt: timestamp("paidAt"),
    dueAt: timestamp("dueAt"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Payment_orderId_idx").on(t.orderId)],
);

export const refund = sqliteTable(
  "Refund",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    paymentId: text("paymentId").notNull(),
    amount: decimal("amount").notNull(),
    status: text("status", { enum: ["PENDING", "COMPLETED", "FAILED"] })
      .notNull()
      .default("PENDING"),
    reason: text("reason"),
    providerRef: text("providerRef"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: timestamp("completedAt"),
  },
  (t) => [index("Refund_paymentId_idx").on(t.paymentId)],
);

export const shipment = sqliteTable(
  "Shipment",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    orderId: text("orderId").notNull(),
    carrier: text("carrier").notNull(),
    trackingNumber: text("trackingNumber"),
    status: text("status", {
      enum: ["PREPARING", "SHIPPED", "DELIVERED", "RETURNED"],
    })
      .notNull()
      .default("PREPARING"),
    shippedAt: timestamp("shippedAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("Shipment_orderId_idx").on(t.orderId)],
);

export const returnRequest = sqliteTable(
  "ReturnRequest",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    orderId: text("orderId").notNull(),
    status: text("status", {
      enum: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"],
    })
      .notNull()
      .default("REQUESTED"),
    reason: text("reason").notNull(),
    note: text("note"),
    adminNote: text("adminNote"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    resolvedAt: timestamp("resolvedAt"),
  },
  (t) => [
    index("ReturnRequest_orderId_idx").on(t.orderId),
    index("ReturnRequest_status_idx").on(t.status),
  ],
);

export const returnRequestItem = sqliteTable("ReturnRequestItem", {
  id: text("id").primaryKey().$defaultFn(newId),
  returnRequestId: text("returnRequestId").notNull(),
  orderItemId: text("orderItemId").notNull(),
  quantity: integer("quantity").notNull(),
});
