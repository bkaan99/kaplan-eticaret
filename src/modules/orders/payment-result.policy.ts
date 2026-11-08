export type PaymentVerdict = "paid" | "failed" | "amount-mismatch";

/**
 * Sağlayıcı bildirimi + tutar eşleşmesine göre sonucu belirler.
 * Başarılı bildirim ama tutar uyuşmuyorsa ödeme kabul edilmez (inceleme için FAILED).
 */
export function judgePaymentResult(
  providerSuccess: boolean,
  amountMatches: boolean,
): PaymentVerdict {
  if (!providerSuccess) return "failed";
  return amountMatches ? "paid" : "amount-mismatch";
}
