import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { json, newId, timestamp } from "../types";

export const setting = sqliteTable("Setting", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const auditLog = sqliteTable(
  "AuditLog",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    actorId: text("actorId"),
    action: text("action").notNull(),
    entityType: text("entityType").notNull(),
    entityId: text("entityId"),
    before: json("before"),
    after: json("after"),
    ip: text("ip"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("AuditLog_entityType_entityId_idx").on(t.entityType, t.entityId),
    index("AuditLog_actorId_idx").on(t.actorId),
    index("AuditLog_createdAt_idx").on(t.createdAt),
  ],
);

export const rateLimit = sqliteTable(
  "RateLimit",
  {
    key: text("key").notNull(),
    windowStart: timestamp("windowStart").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.windowStart] }),
    index("RateLimit_windowStart_idx").on(t.windowStart),
  ],
);
