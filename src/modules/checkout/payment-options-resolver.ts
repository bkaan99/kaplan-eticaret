import { formatMoney, toDecimal } from "@/shared/money";
import { CreditLimitPolicy } from "../b2b/credit-limit.policy";
import type { CartIdentity } from "../cart/cart.types";
import type {
  CheckoutSettings,
  DealerTerms,
  PaymentOption,
} from "./checkout.types";

export interface PaymentOptionsDeps {
  dealers?: DealerTerms;
  settings: CheckoutSettings;
}

/** Müşteri ve bayi durumuna göre seçilebilir ödeme yöntemlerini belirleyen servis. */
export class PaymentOptionsResolver {
  constructor(private readonly deps: PaymentOptionsDeps) {}

  /** Müşterinin bu sepet için seçebileceği ödeme yöntemlerini ve kalan limitini hesaplar. */
  async resolve(
    identity: CartIdentity,
    grandTotal: string,
  ): Promise<PaymentOption[]> {
    const dealer =
      identity.userId && this.deps.dealers
        ? await this.deps.dealers.findProfile(identity.userId)
        : null;

    const options: PaymentOption[] = [
      { method: "CARD", available: true, note: null },
    ];

    if (dealer?.status !== "APPROVED") return options;

    options.push({
      method: "BANK_TRANSFER",
      available: this.deps.settings.bankTransferConfigured === true,
      note: this.deps.settings.bankTransferConfigured
        ? null
        : "Havale/EFT hesabı tanımlı değil",
    });

    const limit = dealer.creditLimit ? toDecimal(dealer.creditLimit) : null;
    if (!limit || limit.lte(0)) {
      options.push({
        method: "DEFERRED",
        available: false,
        note: "Vadeli ödeme için kredi limitiniz tanımlı değil",
      });
    } else {
      const outstanding = await this.deps.dealers!.outstandingDeferredTotal(
        identity.userId!,
      );
      const evaluation = CreditLimitPolicy.evaluate(
        outstanding,
        grandTotal,
        limit,
      );
      options.push({
        method: "DEFERRED",
        available: evaluation.hasEnoughCredit,
        note: evaluation.hasEnoughCredit
          ? `Kullanılabilir limit: ${formatMoney(evaluation.available)}`
          : `Kredi limitiniz yetersiz (kullanılabilir: ${formatMoney(evaluation.available)})`,
      });
    }

    return options;
  }
}
