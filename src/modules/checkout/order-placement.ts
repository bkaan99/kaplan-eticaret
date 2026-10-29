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
import type { DealerProfileResult } from "./checkout-validator";

export interface OrderPlacementDeps {
  orders: OrderCreationRepository;
  settings: CheckoutSettings;
  events?: EventBus;
  now: () => Date;
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
  constructor(private readonly deps: OrderPlacementDeps) {}

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

    const method = input.paymentMethod;
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
      reservationMinutes:
        method === "BANK_TRANSFER"
          ? (settings.bankTransferHoldHours ?? 72) * 60
          : settings.reservationMinutes,
      paymentProvider:
        method === "CARD" ? settings.paymentProvider : method.toLowerCase(),
      paymentMethod: method,
    };

    let created: CreatedOrder;
    if (method === "DEFERRED") {
      const days = settings.deferredPaymentDays ?? 30;
      created = await this.deps.orders.createDeferredOrder(newOrder, {
        creditLimit: dealer!.creditLimit!,
        dueAt: new Date(this.deps.now().getTime() + days * 24 * 60 * 60 * 1000),
      });
    } else {
      created = await this.deps.orders.createPendingOrder(newOrder);
    }

    if (method !== "CARD") {
      await this.deps.events?.publish("order.placed", {
        orderId: created.orderId,
        method,
      });
    }

    return { ...created, grandTotal: computed.quote.grandTotal };
  }
}
