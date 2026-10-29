import { RetailPriceResolver } from "../catalog/pricing";
import type { CartIdentity } from "../cart/cart.types";
import type { CreatedOrder } from "../orders/order.types";
import type { CheckoutInput } from "./checkout.schema";
import { CheckoutValidator } from "./checkout-validator";
import { CheckoutPricingEngine } from "./checkout-pricing";
import { PaymentOptionsResolver } from "./payment-options-resolver";
import { OrderPlacementService } from "./order-placement";
import type {
  CartSource,
  CheckoutDeps,
  CheckoutQuote,
  CheckoutSettings,
  DealerTerms,
  PaymentOption,
  PricedLine,
} from "./checkout.types";

export type {
  CartSource,
  CheckoutDeps,
  CheckoutQuote,
  CheckoutSettings,
  DealerTerms,
  PaymentOption,
  PricedLine,
};
export { lineVariantName } from "./checkout.types";

/**
 * Checkout süreçlerini koordine eden üst seviye servis (Facade / Orchestrator).
 * İş kuralları, fiyatlama, ödeme seçenekleri ve sipariş oluşturma sorumlulukları
 * odaklı alt servislere (`CheckoutValidator`, `CheckoutPricingEngine`,
 * `PaymentOptionsResolver`, `OrderPlacementService`) delege edilir.
 */
export class CheckoutService {
  private readonly validator: CheckoutValidator;
  private readonly pricing: CheckoutPricingEngine;
  private readonly paymentOptionsResolver: PaymentOptionsResolver;
  private readonly orderPlacement: OrderPlacementService;

  constructor(deps: CheckoutDeps) {
    const now = deps.now ?? (() => new Date());
    const priceResolver = deps.priceResolver ?? new RetailPriceResolver();

    this.validator = new CheckoutValidator({
      carts: deps.carts,
      checkout: deps.checkout,
      orders: deps.orders,
      dealers: deps.dealers,
      customizations: deps.customizations,
      settings: deps.settings,
      now,
    });

    this.pricing = new CheckoutPricingEngine({
      priceResolver,
      shipping: deps.shipping,
      checkout: deps.checkout,
      settings: deps.settings,
      validator: this.validator,
      customizations: deps.customizations,
      now,
    });

    this.paymentOptionsResolver = new PaymentOptionsResolver({
      dealers: deps.dealers,
      settings: deps.settings,
    });

    this.orderPlacement = new OrderPlacementService({
      orders: deps.orders,
      settings: deps.settings,
      events: deps.events,
      now,
    });
  }

  /** Sepet için fiyat/indirim/kargo özetini üretir; veritabanında kayıt oluşturmaz. */
  async quote(
    identity: CartIdentity,
    couponCode: string | null,
    owner: { userId: string | null; email: string | null },
  ): Promise<CheckoutQuote> {
    const { cartId, lines } = await this.validator.loadSellableLines(identity);
    const computed = await this.pricing.compute(
      cartId,
      lines,
      couponCode,
      owner,
      identity.customerGroupId ?? null,
    );
    return computed.quote;
  }

  /** Sepet doğrulaması, fiyatlama ve sipariş kaydını sırayla icra ederek siparişi oluşturur. */
  async placeOrder(
    identity: CartIdentity,
    input: CheckoutInput,
  ): Promise<CreatedOrder & { grandTotal: string }> {
    this.validator.assertGuestCheckoutAllowed(identity.userId);

    const dealer = await this.validator.loadDealer(identity.userId);
    this.validator.assertDealerRequirement(dealer);

    const { cartId, lines } = await this.validator.loadSellableLines(identity);
    const computed = await this.pricing.compute(
      cartId,
      lines,
      input.couponCode,
      { userId: identity.userId, email: input.email },
      identity.customerGroupId ?? null,
    );

    this.validator.assertMinimumOrderAmount(
      dealer,
      computed.quote.subtotal,
      computed.quote.discountTotal,
    );

    await this.validator.assertPaymentMethod(
      input.paymentMethod,
      dealer,
      identity.userId,
      computed.quote.grandTotal,
    );

    return this.orderPlacement.place({
      identity,
      input,
      cartId,
      dealer,
      computed,
    });
  }

  /** Müşterinin bu sepet için seçebileceği ödeme yöntemlerini listeler. */
  async paymentOptions(
    identity: CartIdentity,
    grandTotal: string,
  ): Promise<PaymentOption[]> {
    return this.paymentOptionsResolver.resolve(identity, grandTotal);
  }
}
