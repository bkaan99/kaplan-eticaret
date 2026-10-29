import Decimal from "decimal.js";
import { ConflictError } from "@/shared/errors";
import { formatMoney } from "@/shared/money";

export interface CreditEvaluation {
  used: Decimal;
  requested: Decimal;
  limit: Decimal;
  available: Decimal;
  hasEnoughCredit: boolean;
}

/**
 * B2B Bayi vadeli sipariş kredi limiti domain kuralları.
 */
export class CreditLimitPolicy {
  /**
   * Bayinin kredi limit durumunu değerlendirir.
   */
  static evaluate(
    usedAmount: Decimal.Value,
    requestedAmount: Decimal.Value,
    creditLimit: Decimal.Value,
  ): CreditEvaluation {
    const used = new Decimal(usedAmount || 0);
    const requested = new Decimal(requestedAmount || 0);
    const limit = new Decimal(creditLimit || 0);
    const available = Decimal.max(limit.minus(used), 0);
    const hasEnoughCredit = limit.gt(0) && used.plus(requested).lte(limit);

    return {
      used,
      requested,
      limit,
      available,
      hasEnoughCredit,
    };
  }

  /**
   * Kredi limiti yeterli değilse ConflictError domain hatası fırlatır.
   */
  static assertAllowed(
    usedAmount: Decimal.Value,
    requestedAmount: Decimal.Value,
    creditLimit: Decimal.Value,
  ): CreditEvaluation {
    const evaluation = this.evaluate(usedAmount, requestedAmount, creditLimit);
    if (!evaluation.hasEnoughCredit) {
      throw new ConflictError(
        `Kredi limitiniz yetersiz (kullanılabilir: ${evaluation.available.toFixed(2)} TL)`,
      );
    }
    return evaluation;
  }
}
