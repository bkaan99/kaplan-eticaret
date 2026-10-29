import type { EventBus } from "@/shared/events/event-bus";
import { ForbiddenError, ValidationError } from "@/shared/errors";
import { toDecimal } from "@/shared/money";
import { CreditLimitPolicy } from "../b2b/credit-limit.policy";
import type { OrderCreationRepository } from "../orders/order.repository";
import type {
  CreatedOrder,
  NewOrder,
  PaymentMethod,
} from "../orders/order.types";
import type { CheckoutSettings, DealerTerms } from "./checkout.types";
import type { DealerProfileResult } from "./checkout-validator";

export interface CheckoutPaymentValidationParams {
  dealer: DealerProfileResult;
  userId: string | null;
  grandTotal: string;
  settings: CheckoutSettings;
  dealers?: DealerTerms;
}

export interface CheckoutPlacementParams {
  orders: OrderCreationRepository;
  newOrder: NewOrder;
  dealer: DealerProfileResult;
  settings: CheckoutSettings;
  now: () => Date;
}

/**
 * Checkout sürecinde ödeme yöntemine özgü doğrulama, sağlayıcı ayarları,
 * sipariş oluşturma ve olay yayınlama davranışlarını kapsülleyen strateji (OCP).
 */
export interface CheckoutPaymentStrategy {
  readonly method: PaymentMethod;
  validate(params: CheckoutPaymentValidationParams): Promise<void>;
  getReservationMinutes(settings: CheckoutSettings): number;
  getPaymentProvider(settings: CheckoutSettings): string;
  placeOrder(params: CheckoutPlacementParams): Promise<CreatedOrder>;
  publishPlacedEvent(
    events: EventBus | undefined,
    orderId: string,
  ): Promise<void>;
}

/**
 * Kredi kartı ödeme stratejisi.
 */
export class CardPaymentStrategy implements CheckoutPaymentStrategy {
  readonly method: PaymentMethod = "CARD";

  async validate(_params: CheckoutPaymentValidationParams): Promise<void> {
    // Kredi kartı tüm müşterilere ve misafirlere açıktır
  }

  getReservationMinutes(settings: CheckoutSettings): number {
    return settings.reservationMinutes;
  }

  getPaymentProvider(settings: CheckoutSettings): string {
    return settings.paymentProvider;
  }

  async placeOrder(params: CheckoutPlacementParams): Promise<CreatedOrder> {
    return params.orders.createPendingOrder(params.newOrder);
  }

  async publishPlacedEvent(
    _events: EventBus | undefined,
    _orderId: string,
  ): Promise<void> {
    // Kartla ödemede "order.placed" fırlatılmaz; ödeme sağlayıcısından
    // gelen callback sonucunda "order.paid" yayınlanır.
  }
}

/**
 * Havale / EFT ödeme stratejisi.
 */
export class BankTransferPaymentStrategy implements CheckoutPaymentStrategy {
  readonly method: PaymentMethod = "BANK_TRANSFER";

  async validate(params: CheckoutPaymentValidationParams): Promise<void> {
    if (params.dealer?.status !== "APPROVED") {
      throw new ForbiddenError(
        "Bu ödeme yöntemi yalnızca onaylı bayiler içindir",
      );
    }
    if (!params.settings.bankTransferConfigured) {
      throw new ValidationError("Havale/EFT şu anda kullanılamıyor");
    }
  }

  getReservationMinutes(settings: CheckoutSettings): number {
    return (settings.bankTransferHoldHours ?? 72) * 60;
  }

  getPaymentProvider(_settings: CheckoutSettings): string {
    return "bank_transfer";
  }

  async placeOrder(params: CheckoutPlacementParams): Promise<CreatedOrder> {
    return params.orders.createPendingOrder(params.newOrder);
  }

  async publishPlacedEvent(
    events: EventBus | undefined,
    orderId: string,
  ): Promise<void> {
    await events?.publish("order.placed", {
      orderId,
      method: "BANK_TRANSFER",
    });
  }
}

/**
 * B2B Vadeli ödeme stratejisi.
 */
export class DeferredPaymentStrategy implements CheckoutPaymentStrategy {
  readonly method: PaymentMethod = "DEFERRED";

  async validate(params: CheckoutPaymentValidationParams): Promise<void> {
    if (params.dealer?.status !== "APPROVED") {
      throw new ForbiddenError(
        "Bu ödeme yöntemi yalnızca onaylı bayiler içindir",
      );
    }

    const limit = params.dealer.creditLimit
      ? toDecimal(params.dealer.creditLimit)
      : null;
    if (!limit || limit.lte(0)) {
      throw new ValidationError(
        "Vadeli ödeme için kredi limitiniz tanımlı değil",
      );
    }

    const outstanding = await params.dealers!.outstandingDeferredTotal(
      params.userId!,
    );
    CreditLimitPolicy.assertAllowed(outstanding, params.grandTotal, limit);
  }

  getReservationMinutes(settings: CheckoutSettings): number {
    return settings.reservationMinutes;
  }

  getPaymentProvider(_settings: CheckoutSettings): string {
    return "deferred";
  }

  async placeOrder(params: CheckoutPlacementParams): Promise<CreatedOrder> {
    const days = params.settings.deferredPaymentDays ?? 30;
    const dueAt = new Date(
      params.now().getTime() + days * 24 * 60 * 60 * 1000,
    );
    return params.orders.createDeferredOrder(params.newOrder, {
      creditLimit: params.dealer!.creditLimit!,
      dueAt,
    });
  }

  async publishPlacedEvent(
    events: EventBus | undefined,
    orderId: string,
  ): Promise<void> {
    await events?.publish("order.placed", {
      orderId,
      method: "DEFERRED",
    });
  }
}

/**
 * Checkout ödeme stratejilerini yöneten kayıt sınıfı.
 */
export class CheckoutPaymentStrategyRegistry {
  private readonly strategies = new Map<PaymentMethod, CheckoutPaymentStrategy>();

  register(strategy: CheckoutPaymentStrategy): this {
    this.strategies.set(strategy.method, strategy);
    return this;
  }

  get(method: PaymentMethod): CheckoutPaymentStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new ValidationError(`Geçersiz ödeme yöntemi: ${method}`);
    }
    return strategy;
  }
}

/**
 * Standart checkout ödeme stratejisi kayıt defterini oluşturur.
 */
export function createDefaultCheckoutPaymentStrategies(): CheckoutPaymentStrategyRegistry {
  const registry = new CheckoutPaymentStrategyRegistry();
  registry.register(new CardPaymentStrategy());
  registry.register(new BankTransferPaymentStrategy());
  registry.register(new DeferredPaymentStrategy());
  return registry;
}
