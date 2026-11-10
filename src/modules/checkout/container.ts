import { siteConfig } from "@/config/site.config";
import { features } from "@/config/features";
import { getCardProviderKind } from "@/integrations/payment/container";
import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { cartService } from "../cart/container";
import { priceResolver } from "../catalog/container";
import { customPickleService } from "../custom-pickle/container";
import { D1DealerRepository } from "../b2b/dealer.repository";
import { orderRepository } from "../orders/container";
import { settingsService } from "../settings/container";
import { D1CheckoutRepository } from "./checkout.repository";
import { CheckoutService } from "./checkout.service";
import { ConfiguredShippingRateCalculator } from "./shipping";

export async function getCheckoutService(): Promise<CheckoutService> {
  // Ödeme modu panelden seçilir; kart ödemesi kullanılamıyorsa checkout bunu bilir.
  const [cardProvider, shipping] = await Promise.all([
    getCardProviderKind(),
    settingsService.getShippingConfig(),
  ]);

  return new CheckoutService({
    carts: cartService,
    priceResolver,
    checkout: new D1CheckoutRepository(getDb),
    orders: orderRepository,
    shipping: new ConfiguredShippingRateCalculator(shipping),
    settings: {
      guestCheckoutEnabled: features.guestCheckout,
      reservationMinutes: siteConfig.inventory.reservationMinutes,
      shippingTaxRate: shipping.taxRate,
      paymentProvider: cardProvider === "paytr" ? "paytr" : "dev",
      cardPaymentAvailable: cardProvider !== "unavailable",
      requireDealer: siteConfig.salesMode === "b2b",
      bankTransferConfigured: siteConfig.b2b.bankAccounts.length > 0,
      bankTransferHoldHours: siteConfig.b2b.bankTransferHoldHours,
      deferredPaymentDays: siteConfig.b2b.deferredPaymentDays,
    },
    dealers: features.b2b ? new D1DealerRepository(getDb) : undefined,
    events: getEventBus(),
    customizations: customPickleService,
  });
}
