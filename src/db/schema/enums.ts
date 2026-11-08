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
