// Veri modelinin tek kaynağı (Drizzle). Tablo/kolon adları D1 migration'larıyla (db/migrations) birebir eşleşir:
// şemayı değiştirirken yeni bir `db/migrations/NNNN_*.sql` yazın, burayı da güncelleyin.
// İlk sürüm, Prisma şemasından otomatik üretilmiştir.
import Decimal from "decimal.js";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { decimal, json, newId, timestamp } from "./types";

export const userTypeValues = ["CUSTOMER", "STAFF"] as const;
export type UserType = (typeof userTypeValues)[number];
export const b2BStatusValues = [
  "NONE",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type B2BStatus = (typeof b2BStatusValues)[number];
export const productStatusValues = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof productStatusValues)[number];
export const attributeTypeValues = ["SELECT", "MULTI_SELECT"] as const;
export type AttributeType = (typeof attributeTypeValues)[number];
export const discountTypeValues = ["PERCENT", "FIXED"] as const;
export type DiscountType = (typeof discountTypeValues)[number];
export const orderStatusValues = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof orderStatusValues)[number];
export const paymentStatusValues = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
export type PaymentStatus = (typeof paymentStatusValues)[number];
export const paymentMethodTypeValues = [
  "CARD",
  "BANK_TRANSFER",
  "DEFERRED",
] as const;
export type PaymentMethodType = (typeof paymentMethodTypeValues)[number];
export const refundStatusValues = ["PENDING", "COMPLETED", "FAILED"] as const;
export type RefundStatus = (typeof refundStatusValues)[number];
export const shipmentStatusValues = [
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
] as const;
export type ShipmentStatus = (typeof shipmentStatusValues)[number];
export const returnStatusValues = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;
export type ReturnStatus = (typeof returnStatusValues)[number];
export const reservationStatusValues = [
  "ACTIVE",
  "CONSUMED",
  "RELEASED",
  "EXPIRED",
] as const;
export type ReservationStatus = (typeof reservationStatusValues)[number];
export const invoiceTypeValues = ["INDIVIDUAL", "CORPORATE"] as const;
export type InvoiceType = (typeof invoiceTypeValues)[number];
export const pickleIngredientGroupValues = ["VEGETABLE", "AROMA"] as const;
export type PickleIngredientGroup =
  (typeof pickleIngredientGroupValues)[number];

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

export const category = sqliteTable(
  "Category",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    parentId: text("parentId"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    sortOrder: integer("sortOrder").notNull().default(0),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("Category_parentId_idx").on(t.parentId)],
);

export const brand = sqliteTable("Brand", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const product = sqliteTable(
  "Product",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    status: text("status", { enum: ["DRAFT", "ACTIVE", "ARCHIVED"] })
      .notNull()
      .default("DRAFT"),
    categoryId: text("categoryId").notNull(),
    brandId: text("brandId"),
    taxRate: decimal("taxRate").notNull().default(new Decimal(1)),
    trackInventory: integer("trackInventory", { mode: "boolean" })
      .notNull()
      .default(true),
    desi: decimal("desi"),
    weightGram: integer("weightGram"),
    /** İçindekiler listesi (serbest metin) */
    ingredients: text("ingredients"),
    /** Alerjen uyarısı (ör. "Hardal içerir") */
    allergens: text("allergens"),
    /** Raf ömrü / tüketim süresi (ör. "Açılmadan 12 ay") */
    shelfLife: text("shelfLife"),
    isFeatured: integer("isFeatured", { mode: "boolean" })
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
  },
  (t) => [
    index("Product_categoryId_idx").on(t.categoryId),
    index("Product_brandId_idx").on(t.brandId),
    index("Product_status_idx").on(t.status),
  ],
);

export const productOption = sqliteTable(
  "ProductOption",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [unique("ProductOption_productId_name_key").on(t.productId, t.name)],
);

export const productOptionValue = sqliteTable(
  "ProductOptionValue",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    optionId: text("optionId").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("ProductOptionValue_optionId_value_key").on(t.optionId, t.value),
  ],
);

export const productVariant = sqliteTable(
  "ProductVariant",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    sku: text("sku").notNull().unique(),
    barcode: text("barcode"),
    price: decimal("price").notNull(),
    compareAtPrice: decimal("compareAtPrice"),
    currency: text("currency").notNull().default("TRY"),
    stockQuantity: integer("stockQuantity").notNull().default(0),
    reservedQuantity: integer("reservedQuantity").notNull().default(0),
    desi: decimal("desi"),
    weightGram: integer("weightGram"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("ProductVariant_productId_idx").on(t.productId)],
);

export const variantOptionValue = sqliteTable(
  "VariantOptionValue",
  {
    variantId: text("variantId").notNull(),
    optionValueId: text("optionValueId").notNull(),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.optionValueId] })],
);

export const productImage = sqliteTable(
  "ProductImage",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    productId: text("productId").notNull(),
    optionValueId: text("optionValueId"),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("createdAt")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("ProductImage_productId_position_idx").on(t.productId, t.position),
  ],
);

export const attribute = sqliteTable("Attribute", {
  id: text("id").primaryKey().$defaultFn(newId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type", { enum: ["SELECT", "MULTI_SELECT"] })
    .notNull()
    .default("SELECT"),
  isFilterable: integer("isFilterable", { mode: "boolean" })
    .notNull()
    .default(true),
  position: integer("position").notNull().default(0),
});

export const attributeValue = sqliteTable(
  "AttributeValue",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    attributeId: text("attributeId").notNull(),
    value: text("value").notNull(),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("AttributeValue_attributeId_slug_key").on(t.attributeId, t.slug),
  ],
);

export const productAttributeValue = sqliteTable(
  "ProductAttributeValue",
  {
    productId: text("productId").notNull(),
    attributeValueId: text("attributeValueId").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.attributeValueId] }),
    index("ProductAttributeValue_attributeValueId_idx").on(t.attributeValueId),
  ],
);

export const relatedProduct = sqliteTable(
  "RelatedProduct",
  {
    productId: text("productId").notNull(),
    relatedProductId: text("relatedProductId").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.relatedProductId] })],
);

export const redirect = sqliteTable("Redirect", {
  id: text("id").primaryKey().$defaultFn(newId),
  fromPath: text("fromPath").notNull().unique(),
  toPath: text("toPath").notNull(),
  statusCode: integer("statusCode").notNull().default(301),
  createdAt: timestamp("createdAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const variantGroupPrice = sqliteTable(
  "VariantGroupPrice",
  {
    variantId: text("variantId").notNull(),
    groupId: text("groupId").notNull(),
    price: decimal("price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.groupId] })],
);

export const tierPrice = sqliteTable(
  "TierPrice",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    variantId: text("variantId").notNull(),
    groupId: text("groupId"),
    minQuantity: integer("minQuantity").notNull(),
    price: decimal("price").notNull(),
  },
  (t) => [
    unique("TierPrice_variantId_groupId_minQuantity_key").on(
      t.variantId,
      t.groupId,
      t.minQuantity,
    ),
  ],
);

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

export const userRelations = relations(user, ({ one, many }) => ({
  customer: one(customer),
  roles: many(userRole),
  addresses: many(address),
  carts: many(cart),
  orders: many(order),
  wishlist: many(wishlistItem),
  auditLogs: many(auditLog),
}));

export const roleRelations = relations(role, ({ many }) => ({
  permissions: many(rolePermission),
  users: many(userRole),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, { fields: [rolePermission.roleId], references: [role.id] }),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, { fields: [userRole.userId], references: [user.id] }),
  role: one(role, { fields: [userRole.roleId], references: [role.id] }),
}));

export const customerGroupRelations = relations(customerGroup, ({ many }) => ({
  customers: many(customer),
  groupPrices: many(variantGroupPrice),
  tierPrices: many(tierPrice),
}));

export const customerRelations = relations(customer, ({ one }) => ({
  user: one(user, { fields: [customer.userId], references: [user.id] }),
  group: one(customerGroup, {
    fields: [customer.groupId],
    references: [customerGroup.id],
  }),
}));

export const addressRelations = relations(address, ({ one }) => ({
  user: one(user, { fields: [address.userId], references: [user.id] }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  parent: one(category, {
    fields: [category.parentId],
    references: [category.id],
    relationName: "CategoryTree",
  }),
  children: many(category, { relationName: "CategoryTree" }),
  products: many(product),
}));

export const brandRelations = relations(brand, ({ many }) => ({
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  brand: one(brand, { fields: [product.brandId], references: [brand.id] }),
  options: many(productOption),
  variants: many(productVariant),
  images: many(productImage),
  attributes: many(productAttributeValue),
  wishlist: many(wishlistItem),
  related: many(relatedProduct, { relationName: "RelatedFrom" }),
  relatedTo: many(relatedProduct, { relationName: "RelatedTo" }),
}));

export const productOptionRelations = relations(
  productOption,
  ({ one, many }) => ({
    product: one(product, {
      fields: [productOption.productId],
      references: [product.id],
    }),
    values: many(productOptionValue),
  }),
);

export const productOptionValueRelations = relations(
  productOptionValue,
  ({ one, many }) => ({
    option: one(productOption, {
      fields: [productOptionValue.optionId],
      references: [productOption.id],
    }),
    variants: many(variantOptionValue),
    images: many(productImage),
  }),
);

export const productVariantRelations = relations(
  productVariant,
  ({ one, many }) => ({
    product: one(product, {
      fields: [productVariant.productId],
      references: [product.id],
    }),
    optionValues: many(variantOptionValue),
    groupPrices: many(variantGroupPrice),
    tierPrices: many(tierPrice),
    cartItems: many(cartItem),
    orderItems: many(orderItem),
    reservations: many(stockReservation),
  }),
);

export const variantOptionValueRelations = relations(
  variantOptionValue,
  ({ one }) => ({
    variant: one(productVariant, {
      fields: [variantOptionValue.variantId],
      references: [productVariant.id],
    }),
    optionValue: one(productOptionValue, {
      fields: [variantOptionValue.optionValueId],
      references: [productOptionValue.id],
    }),
  }),
);

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, {
    fields: [productImage.productId],
    references: [product.id],
  }),
  optionValue: one(productOptionValue, {
    fields: [productImage.optionValueId],
    references: [productOptionValue.id],
  }),
}));

export const attributeRelations = relations(attribute, ({ many }) => ({
  values: many(attributeValue),
}));

export const attributeValueRelations = relations(
  attributeValue,
  ({ one, many }) => ({
    attribute: one(attribute, {
      fields: [attributeValue.attributeId],
      references: [attribute.id],
    }),
    products: many(productAttributeValue),
  }),
);

export const productAttributeValueRelations = relations(
  productAttributeValue,
  ({ one }) => ({
    product: one(product, {
      fields: [productAttributeValue.productId],
      references: [product.id],
    }),
    attributeValue: one(attributeValue, {
      fields: [productAttributeValue.attributeValueId],
      references: [attributeValue.id],
    }),
  }),
);

export const relatedProductRelations = relations(relatedProduct, ({ one }) => ({
  product: one(product, {
    fields: [relatedProduct.productId],
    references: [product.id],
    relationName: "RelatedFrom",
  }),
  relatedProduct: one(product, {
    fields: [relatedProduct.relatedProductId],
    references: [product.id],
    relationName: "RelatedTo",
  }),
}));

export const variantGroupPriceRelations = relations(
  variantGroupPrice,
  ({ one }) => ({
    variant: one(productVariant, {
      fields: [variantGroupPrice.variantId],
      references: [productVariant.id],
    }),
    group: one(customerGroup, {
      fields: [variantGroupPrice.groupId],
      references: [customerGroup.id],
    }),
  }),
);

export const tierPriceRelations = relations(tierPrice, ({ one }) => ({
  variant: one(productVariant, {
    fields: [tierPrice.variantId],
    references: [productVariant.id],
  }),
  group: one(customerGroup, {
    fields: [tierPrice.groupId],
    references: [customerGroup.id],
  }),
}));

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, { fields: [cart.userId], references: [user.id] }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.id] }),
  variant: one(productVariant, {
    fields: [cartItem.variantId],
    references: [productVariant.id],
  }),
}));

export const stockReservationRelations = relations(
  stockReservation,
  ({ one }) => ({
    variant: one(productVariant, {
      fields: [stockReservation.variantId],
      references: [productVariant.id],
    }),
    order: one(order, {
      fields: [stockReservation.orderId],
      references: [order.id],
    }),
  }),
);

export const wishlistItemRelations = relations(wishlistItem, ({ one }) => ({
  user: one(user, { fields: [wishlistItem.userId], references: [user.id] }),
  product: one(product, {
    fields: [wishlistItem.productId],
    references: [product.id],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, { fields: [order.userId], references: [user.id] }),
  items: many(orderItem),
  payments: many(payment),
  shipments: many(shipment),
  returns: many(returnRequest),
  reservations: many(stockReservation),
}));

export const orderItemRelations = relations(orderItem, ({ one, many }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
  variant: one(productVariant, {
    fields: [orderItem.variantId],
    references: [productVariant.id],
  }),
  returns: many(returnRequestItem),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  order: one(order, { fields: [payment.orderId], references: [order.id] }),
  refunds: many(refund),
}));

export const refundRelations = relations(refund, ({ one }) => ({
  payment: one(payment, {
    fields: [refund.paymentId],
    references: [payment.id],
  }),
}));

export const shipmentRelations = relations(shipment, ({ one }) => ({
  order: one(order, { fields: [shipment.orderId], references: [order.id] }),
}));

export const returnRequestRelations = relations(
  returnRequest,
  ({ one, many }) => ({
    order: one(order, {
      fields: [returnRequest.orderId],
      references: [order.id],
    }),
    items: many(returnRequestItem),
  }),
);

export const returnRequestItemRelations = relations(
  returnRequestItem,
  ({ one }) => ({
    returnRequest: one(returnRequest, {
      fields: [returnRequestItem.returnRequestId],
      references: [returnRequest.id],
    }),
    orderItem: one(orderItem, {
      fields: [returnRequestItem.orderItemId],
      references: [orderItem.id],
    }),
  }),
);

export const menuRelations = relations(menu, ({ many }) => ({
  items: many(menuItem),
}));

export const menuItemRelations = relations(menuItem, ({ one, many }) => ({
  menu: one(menu, { fields: [menuItem.menuId], references: [menu.id] }),
  parent: one(menuItem, {
    fields: [menuItem.parentId],
    references: [menuItem.id],
    relationName: "MenuTree",
  }),
  children: many(menuItem, { relationName: "MenuTree" }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, { fields: [auditLog.actorId], references: [user.id] }),
}));

export const tables = {
  user,
  role,
  rolePermission,
  userRole,
  customerGroup,
  customer,
  address,
  category,
  brand,
  product,
  productOption,
  productOptionValue,
  productVariant,
  variantOptionValue,
  productImage,
  attribute,
  attributeValue,
  productAttributeValue,
  relatedProduct,
  redirect,
  variantGroupPrice,
  tierPrice,
  cart,
  cartItem,
  stockReservation,
  wishlistItem,
  coupon,
  campaign,
  order,
  orderItem,
  payment,
  refund,
  shipment,
  returnRequest,
  returnRequestItem,
  banner,
  page,
  menu,
  menuItem,
  setting,
  auditLog,
  rateLimit,
  pickleIngredient,
};
