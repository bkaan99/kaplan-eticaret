import { toDecimal } from "@/shared/money";
import type { EventBus } from "@/shared/events/event-bus";
import type { CartIdentity } from "../cart/cart.types";
import type { OrderCreationRepository } from "../orders/order.repository";
import type {
  AddressSnapshot,
  CreatedOrder,
  NewOrderItem,
} from "../orders/order.types";
import type { CheckoutInput } from "./checkout.schema";
import {
  lineVariantName,
  type CheckoutSettings,
  type ComputedCheckout,
} from "./checkout.types";
import {
  CheckoutPaymentStrategyRegistry,
  createDefaultCheckoutPaymentStrategies,
} from "./checkout-payment-strategy";
import type { DealerProfileResult } from "./checkout-validator";

export interface OrderPlacementDeps {
  orders: OrderCreationRepository;
  settings: CheckoutSettings;
  events?: EventBus;
  now: () => Date;
  strategies?: CheckoutPaymentStrategyRegistry;
}

export interface PlaceOrderParams {
  identity: CartIdentity;
  input: CheckoutInput;
  cartId: string;
  dealer: DealerProfileResult;
  computed: ComputedCheckout;
}

/** Sipariş nesnesinin oluşturulması, kaydedilmesi ve olay yayınlanmasından sorumlu servis. */
export class OrderPlacementService {
  private readonly strategies: CheckoutPaymentStrategyRegistry;

  constructor(private readonly deps: OrderPlacementDeps) {
    this.strategies =
      deps.strategies ?? createDefaultCheckoutPaymentStrategies();
  }

  /** Hesaplanmış checkout verisinden sipariş oluşturur ve ilgili olayları tetikler. */
  async place(
    params: PlaceOrderParams,
  ): Promise<CreatedOrder & { grandTotal: string }> {
    const { identity, input, cartId, dealer, computed } = params;

    const items: NewOrderItem[] = computed.priced.map((entry, index) => ({
      variantId: entry.record.variantId,
      productName: entry.record.product.name,
      variantName: lineVariantName(entry),
      customization: entry.custom?.snapshot,
      sku: entry.record.sku,
      unitPrice: entry.unitPrice.toFixed(2),
      taxRate: toDecimal(entry.record.product.taxRate).toFixed(2),
      quantity: entry.record.quantity,
      lineTotal: computed.totals.lines[index]!.lineTotal.toFixed(2),
      trackInventory: entry.record.product.trackInventory,
    }));

    const shipping: AddressSnapshot = input.shippingAddress;
    const billing: AddressSnapshot =
      input.billingAddress ?? input.shippingAddress;

    const strategy = this.strategies.get(input.paymentMethod);
    const settings = this.deps.settings;

    const newOrder = {
      userId: identity.userId,
      email: input.email,
      cartId,
      currency: computed.quote.currency,
      subtotal: computed.quote.subtotal,
      discountTotal: computed.quote.discountTotal,
      shippingTotal: computed.quote.shippingTotal,
      taxTotal: computed.quote.taxTotal,
      grandTotal: computed.quote.grandTotal,
      couponCode: computed.appliedCoupon,
      shippingAddress: shipping,
      billingAddress: billing,
      customerNote: input.customerNote,
      items,
      reservationMinutes: strategy.getReservationMinutes(settings),
      paymentProvider: strategy.getPaymentProvider(settings),
      paymentMethod: input.paymentMethod,
    };

    const created = await strategy.placeOrder({
      orders: this.deps.orders,
      newOrder,
      dealer,
      settings,
      now: this.deps.now,
    });

    await strategy.publishPlacedEvent(this.deps.events, created.orderId);

    return { ...created, grandTotal: computed.quote.grandTotal };
  }
}
