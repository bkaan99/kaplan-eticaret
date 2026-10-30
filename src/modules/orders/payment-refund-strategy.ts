import type { PaymentRefunder } from "@/integrations/payment/payment-provider";
import type { PaymentMethod } from "./order.types";

export interface RefundContext {
  orderId: string;
  merchantOid: string;
  amount: string;
  method: PaymentMethod;
}

export interface RefundResult {
  providerRef: string | null;
  reason: string;
}

/**
 * Ödeme yöntemine özgü iade davranışını kapsülleyen strateji arayüzü (OCP).
 */
export interface PaymentRefundStrategy {
  readonly method: PaymentMethod;
  refund(context: RefundContext): Promise<RefundResult>;
}

/**
 * Kredi kartı iade stratejisi: Sağlayıcı (PayTR vb.) API'sini çağırarak
 * otomatik iade başlatır ve sağlayıcı referans numarasını döner.
 */
export class CardRefundStrategy implements PaymentRefundStrategy {
  readonly method: PaymentMethod = "CARD";

  constructor(private readonly refunder: PaymentRefunder) {}

  async refund(context: RefundContext): Promise<RefundResult> {
    const result = await this.refunder.refund({
      merchantOid: context.merchantOid,
      amount: context.amount,
    });
    return {
      providerRef: result.providerRef,
      reason: "İptal",
    };
  }
}

/**
 * Manuel iade stratejisi: Havale/EFT ve Vadeli gibi doğrudan entegrasyonu
 * bulunmayan yöntemler için manuel muhasebe iadesi kaydı açar.
 */
export class ManualRefundStrategy implements PaymentRefundStrategy {
  constructor(readonly method: PaymentMethod) {}

  async refund(_context: RefundContext): Promise<RefundResult> {
    return {
      providerRef: null,
      reason: "İptal (manuel iade)",
    };
  }
}

/**
 * Ödeme yöntemine göre ilgili iade stratejisini çözen kayıt yöneticisi (Registry).
 */
export class PaymentRefundStrategyRegistry {
  private readonly strategies = new Map<PaymentMethod, PaymentRefundStrategy>();

  register(strategy: PaymentRefundStrategy): this {
    this.strategies.set(strategy.method, strategy);
    return this;
  }

  get(method: PaymentMethod): PaymentRefundStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      // Bilinmeyen veya yeni eklenen yöntemler için güvenli varsayılan olarak manuel iade kullanılır
      return new ManualRefundStrategy(method);
    }
    return strategy;
  }
}

/**
 * Standart ödeme yöntemleri için hazır strateji kayıt defterini oluşturur.
 */
export function createDefaultRefundRegistry(
  refunder: PaymentRefunder,
): PaymentRefundStrategyRegistry {
  const registry = new PaymentRefundStrategyRegistry();
  registry.register(new CardRefundStrategy(refunder));
  registry.register(new ManualRefundStrategy("BANK_TRANSFER"));
  registry.register(new ManualRefundStrategy("DEFERRED"));
  return registry;
}
