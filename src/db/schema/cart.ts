import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { json, newId, timestamp } from "../types";

export const cart = sqliteTable(
  "Cart",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    userId: text("userId"),
    sessionToken: text("sessionToken").unique(),
    currency: text("currency").notNull().default("TRY"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Cart_userId_idx").on(t.userId)],
);

export const cartItem = sqliteTable(
  "CartItem",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    cartId: text("cartId").notNull(),
    variantId: text("variantId").notNull(),
    quantity: integer("quantity").notNull(),
    customizationKey: text("customizationKey").notNull().default(""),
    customization: json("customization"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    unique("CartItem_cartId_variantId_customizationKey_key").on(
      t.cartId,
      t.variantId,
      t.customizationKey,
    ),
  ],
);

export const stockReservation = sqliteTable(
  "StockReservation",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    variantId: text("variantId").notNull(),
    orderId: text("orderId"),
    quantity: integer("quantity").notNull(),
    status: text("status", {
      enum: ["ACTIVE", "CONSUMED", "RELEASED", "EXPIRED"],
    })
      .notNull()
      .default("ACTIVE"),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("StockReservation_status_expiresAt_idx").on(t.status, t.expiresAt),
    index("StockReservation_variantId_idx").on(t.variantId),
  ],
);

export const wishlistItem = sqliteTable(
  "WishlistItem",
  {
    userId: text("userId").notNull(),
    productId: text("productId").notNull(),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);
