import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { json, newId, timestamp } from "../types";

export const WHOLESALE_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CLOSED",
] as const;

export type WholesaleLeadStatus = (typeof WHOLESALE_LEAD_STATUSES)[number];

export const wholesaleLead = sqliteTable(
  "WholesaleLead",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    companyName: text("companyName").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    businessType: text("businessType").notNull(),
    orderVolume: text("orderVolume").notNull(),
    details: text("details"),
    contactChannels: json<string[]>("contactChannels").notNull(),
    note: text("note"),
    status: text("status").$type<WholesaleLeadStatus>().notNull().default("NEW"),
    adminNote: text("adminNote"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("WholesaleLead_status_createdAt_idx").on(t.status, t.createdAt),
    index("WholesaleLead_createdAt_idx").on(t.createdAt),
  ],
);
