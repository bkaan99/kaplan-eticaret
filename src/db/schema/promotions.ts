import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decimal, json, newId, timestamp } from "../types";

export const coupon = sqliteTable("Coupon", {
  id: text("id").primaryKey().$defaultFn(newId),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["PERCENT", "FIXED"] }).notNull(),
  value: decimal("value").notNull(),
  minSubtotal: decimal("minSubtotal"),
  maxUses: integer("maxUses"),
  perCustomerLimit: integer("perCustomerLimit"),
  usedCount: integer("usedCount").notNull().default(0),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const campaign = sqliteTable("Campaign", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull(),
  ruleType: text("ruleType").notNull(),
  config: json("config").notNull(),
  priority: integer("priority").notNull().default(0),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});
