import { relations } from "drizzle-orm";
import {
  user,
  role,
  rolePermission,
  userRole,
  customerGroup,
  customer,
  address,
} from "./identity";
import {
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
  variantGroupPrice,
  tierPrice,
} from "./catalog";
import { cart, cartItem, stockReservation, wishlistItem } from "./cart";
import {
  order,
  orderItem,
  payment,
  refund,
  shipment,
  returnRequest,
  returnRequestItem,
} from "./orders";
import { menu, menuItem } from "./content";
import { auditLog } from "./system";

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
