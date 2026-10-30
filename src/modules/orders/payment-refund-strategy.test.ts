import { describe, expect, it, vi } from "vitest";
import type { PaymentRefunder } from "@/integrations/payment/payment-provider";
import {
  CardRefundStrategy,
  ManualRefundStrategy,
  PaymentRefundStrategyRegistry,
  createDefaultRefundRegistry,
} from "./payment-refund-strategy";

describe("PaymentRefundStrategy", () => {
  it("CardRefundStrategy sağlayıcıyı çağırarak iade referansını ve nedenini döner", async () => {
    const refunder: PaymentRefunder = {
      refund: vi.fn(async () => ({ providerRef: "provider-tx-123" })),
    };
    const strategy = new CardRefundStrategy(refunder);

    const result = await strategy.refund({
      orderId: "order-1",
      merchantOid: "ORD123",
      amount: "250.00",
      method: "CARD",
    });

    expect(refunder.refund).toHaveBeenCalledWith({
      merchantOid: "ORD123",
      amount: "250.00",
    });
    expect(result).toEqual({
      providerRef: "provider-tx-123",
      reason: "İptal",
    });
  });

  it("ManualRefundStrategy sağlayıcı çağırmadan manuel iade nedenini döner", async () => {
    const strategy = new ManualRefundStrategy("BANK_TRANSFER");

    const result = await strategy.refund({
      orderId: "order-2",
      merchantOid: "ORD456",
      amount: "500.00",
      method: "BANK_TRANSFER",
    });

    expect(result).toEqual({
      providerRef: null,
      reason: "İptal (manuel iade)",
    });
  });

  it("PaymentRefundStrategyRegistry yönteme göre doğru stratejiyi çözümler", async () => {
    const refunder: PaymentRefunder = {
      refund: vi.fn(async () => ({ providerRef: "card-ref" })),
    };
    const registry = createDefaultRefundRegistry(refunder);

    const cardStrat = registry.get("CARD");
    expect(cardStrat).toBeInstanceOf(CardRefundStrategy);

    const transferStrat = registry.get("BANK_TRANSFER");
    expect(transferStrat).toBeInstanceOf(ManualRefundStrategy);

    const deferredStrat = registry.get("DEFERRED");
    expect(deferredStrat).toBeInstanceOf(ManualRefundStrategy);

    // Kayıtlı olmayan bir yöntem için ManualRefundStrategy döner
    const fallbackStrat = registry.get("UNKNOWN" as any);
    expect(fallbackStrat).toBeInstanceOf(ManualRefundStrategy);
  });
});
