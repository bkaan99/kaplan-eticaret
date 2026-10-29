import type Decimal from "decimal.js";
import type { CartIdentity, CartMutationResult } from "../cart/cart.types";
import type { PriceResolver } from "../catalog/pricing";
import type { CustomizationPricer, CustomizationQuote } from "../custom-pickle/custom-pickle.types";
import type { EventBus } from "@/shared/events/event-bus";
import type {
  CouponUsageRepository,
  OrderCreationRepository,
} from "../orders/order.repository";
import type { CheckoutLineRecord, CheckoutRepository } from "./checkout.repository";
import type { ShippingRateCalculator } from "./shipping";
import type { OrderTotals } from "./totals";
import type { AppliedDiscount } from "./discounts";

/** Checkout'un sepetten yalnızca ihtiyaç duyduğu parça. */
export interface CartSource {
  getCart(identity: CartIdentity): Promise<CartMutationResult>;
}

export interface CheckoutSettings {
  guestCheckoutEnabled: boolean;
  reservationMinutes: number;
  shippingTaxRate: number;
  paymentProvider: string;
  /** true ise yalnızca onaylı bayiler sipariş verebilir (salesMode: b2b) */
  requireDealer?: boolean;
  /** Havale/EFT seçeneği için hesap tanımlı mı? */
  bankTransferConfigured?: boolean;
  bankTransferHoldHours?: number;
  deferredPaymentDays?: number;
}

/** Checkout'un bayi bilgisinden yalnızca ihtiyaç duyduğu parça. */
export interface DealerTerms {
  findProfile(userId: string): Promise<{
    status: string;
    creditLimit: string | null;
    minOrderAmount: string | null;
  } | null>;
  outstandingDeferredTotal(userId: string): Promise<Decimal>;
}

export interface PaymentOption {
  method: "CARD" | "BANK_TRANSFER" | "DEFERRED";
  available: boolean;
  /** Seçilemiyorsa nedeni; seçilebiliyorsa ek bilgi (örn. kalan kredi) */
  note: string | null;
}

export interface CheckoutQuote {
  cartId: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  discounts: { label: string; amount: string }[];
  lines: {
    variantId: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
}

export interface PricedLine {
  record: CheckoutLineRecord;
  unitPrice: Decimal;
  /** Özelleştirilmiş satırın fiyatlandırılmış hâli */
  custom?: CustomizationQuote;
}

export interface ComputedCheckout {
  priced: PricedLine[];
  totals: OrderTotals;
  appliedCoupon: string | null;
  quote: CheckoutQuote;
}

export function lineVariantName(entry: PricedLine): string | null {
  const option = entry.record.optionLabels.length
    ? entry.record.optionLabels.join(" / ")
    : null;
  if (!entry.custom) return option;
  return [option, entry.custom.summary].filter(Boolean).join(" · ");
}

export interface CheckoutDeps {
  carts: CartSource;
  checkout: CheckoutRepository;
  orders: OrderCreationRepository & CouponUsageRepository;
  shipping: ShippingRateCalculator;
  settings: CheckoutSettings;
  priceResolver?: PriceResolver;
  dealers?: DealerTerms;
  events?: EventBus;
  /** Kendi turşunu yap satırlarının ek ücretleri */
  customizations?: CustomizationPricer;
  now?: () => Date;
}
