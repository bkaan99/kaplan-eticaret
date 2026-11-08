import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decimal, newId, timestamp } from "../types";

export const pickleIngredient = sqliteTable(
  "PickleIngredient",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    group: text("group", { enum: ["VEGETABLE", "AROMA"] })
      .notNull()
      .default("VEGETABLE"),
    description: text("description"),
    imageUrl: text("imageUrl"),
    pricePerKg: decimal("pricePerKg").notNull(),
    stockKg: decimal("stockKg"),
    minStockKg: decimal("minStockKg"),
    seasonStartMonth: integer("seasonStartMonth"),
    seasonEndMonth: integer("seasonEndMonth"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("PickleIngredient_isActive_sortOrder_idx").on(
      t.isActive,
      t.sortOrder,
    ),
  ],
);
