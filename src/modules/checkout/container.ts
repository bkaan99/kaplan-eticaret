import { siteConfig } from "@/config/site.config";
import { features } from "@/config/features";
import { getPaymentProvider } from "@/integrations/payment/container";
import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { cartService } from "../cart/container";
import { priceResolver } from "../catalog/container";
import { customPickleService } from "../custom-pickle/container";
import { PrismaDealerRepository } from "../b2b/dealer.repository";
import { orderRepository } from "../orders/container";
import { PrismaCheckoutRepository } from "./checkout.repository";
import { CheckoutService } from "./checkout.service";
import { ConfiguredShippingRateCalculator } from "./shipping";

export function getCheckoutService(): CheckoutService {
  return new CheckoutService({
    carts: cartService,
    priceResolver,
    checkout: new PrismaCheckoutRepository(getDb),
    orders: orderRepository,
    shipping: new ConfiguredShippingRateCalculator(),
    settings: {
      guestCheckoutEnabled: features.guestCheckout,
      reservationMinutes: siteConfig.inventory.reservationMinutes,
      shippingTaxRate: siteConfig.shipping.taxRate,
      paymentProvider: getPaymentProvider().name,
      requireDealer: siteConfig.salesMode === "b2b",
      bankTransferConfigured: siteConfig.b2b.bankAccounts.length > 0,
      bankTransferHoldHours: siteConfig.b2b.bankTransferHoldHours,
      deferredPaymentDays: siteConfig.b2b.deferredPaymentDays,
    },
    dealers: features.b2b ? new PrismaDealerRepository(getDb) : undefined,
    events: getEventBus(),
    customizations: customPickleService,
  });
}
