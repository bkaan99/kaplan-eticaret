import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { decimal, newId, timestamp } from "../types";

export const user = sqliteTable(
  "User",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    email: text("email").notNull().unique(),
    passwordHash: text("passwordHash"),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    phone: text("phone"),
    type: text("type", { enum: ["CUSTOMER", "STAFF"] })
      .notNull()
      .default("CUSTOMER"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    emailVerifiedAt: timestamp("emailVerifiedAt"),
    failedLoginCount: integer("failedLoginCount").notNull().default(0),
    lockedUntil: timestamp("lockedUntil"),
    anonymizedAt: timestamp("anonymizedAt"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("User_type_idx").on(t.type)],
);

export const role = sqliteTable("Role", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: integer("isSystem", { mode: "boolean" }).notNull().default(false),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rolePermission = sqliteTable(
  "RolePermission",
  {
    roleId: text("roleId").notNull(),
    permission: text("permission").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
);

export const userRole = sqliteTable(
  "UserRole",
  {
    userId: text("userId").notNull(),
    roleId: text("roleId").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export const customerGroup = sqliteTable("CustomerGroup", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  discountPercent: decimal("discountPercent"),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const customer = sqliteTable(
  "Customer",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    userId: text("userId").notNull().unique(),
    groupId: text("groupId"),
    b2bStatus: text("b2bStatus", {
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
    })
      .notNull()
      .default("NONE"),
    companyName: text("companyName"),
    taxNumber: text("taxNumber"),
    taxOffice: text("taxOffice"),
    creditLimit: decimal("creditLimit"),
    minOrderAmount: decimal("minOrderAmount"),
    approvedAt: timestamp("approvedAt"),
    b2bNote: text("b2bNote"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Customer_b2bStatus_idx").on(t.b2bStatus)],
);

export const address = sqliteTable(
  "Address",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    userId: text("userId").notNull(),
    title: text("title").notNull(),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    neighborhood: text("neighborhood"),
    addressLine: text("addressLine").notNull(),
    postalCode: text("postalCode"),
    invoiceType: text("invoiceType", { enum: ["INDIVIDUAL", "CORPORATE"] })
      .notNull()
      .default("INDIVIDUAL"),
    nationalId: text("nationalId"),
    companyName: text("companyName"),
    taxNumber: text("taxNumber"),
    taxOffice: text("taxOffice"),
    isDefaultShipping: integer("isDefaultShipping", { mode: "boolean" })
      .notNull()
      .default(false),
    isDefaultBilling: integer("isDefaultBilling", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Address_userId_idx").on(t.userId)],
);
