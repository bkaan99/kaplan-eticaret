import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { newId, timestamp } from "../types";

export const banner = sqliteTable("Banner", {
  id: text("id").primaryKey().$defaultFn(newId),
  title: text("title").notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  sortOrder: integer("sortOrder").notNull().default(0),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const page = sqliteTable("Page", {
  id: text("id").primaryKey().$defaultFn(newId),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  isPublished: integer("isPublished", { mode: "boolean" })
    .notNull()
    .default(false),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const menu = sqliteTable("Menu", {
  id: text("id").primaryKey().$defaultFn(newId),
  key: text("key").notNull().unique(),
});

export const menuItem = sqliteTable(
  "MenuItem",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    menuId: text("menuId").notNull(),
    parentId: text("parentId"),
    label: text("label").notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("MenuItem_menuId_idx").on(t.menuId)],
);
