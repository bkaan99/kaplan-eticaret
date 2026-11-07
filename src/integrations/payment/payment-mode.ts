/**
 * Ödeme modu — yönetim panelinden seçilir.
 * - FAKE: sahte ödeme sayfası. Gerçek tahsilat yok, PayTR anahtarı gerekmez (deneme/test).
 * - PAYTR_TEST: PayTR sandbox. PayTR anahtarı gerekir, gerçek tahsilat yok.
 * - LIVE: gerçek PayTR tahsilatı.
 */
export const PAYMENT_MODES = ["FAKE", "PAYTR_TEST", "LIVE"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/** Kayıt yokken varsayılan: güvenli ve anahtarsız çalışan deneme modu. */
export const DEFAULT_PAYMENT_MODE: PaymentMode = "FAKE";

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  FAKE: "Test modu (sahte ödeme)",
  PAYTR_TEST: "PayTR test (sandbox)",
  LIVE: "Canlı (gerçek ödeme)",
};

export function isPaymentMode(value: unknown): value is PaymentMode {
  return (PAYMENT_MODES as readonly unknown[]).includes(value);
}

/** Bu mod için ödeme alacak sağlayıcı; anahtar yoksa kart ödemesi kapalı (`unavailable`). */
export type ProviderKind = "dev" | "paytr" | "unavailable";

export function providerKindFor(
  mode: PaymentMode,
  paytrConfigured: boolean,
): ProviderKind {
  if (mode === "FAKE") return "dev";
  return paytrConfigured ? "paytr" : "unavailable";
}

export const CARD_UNAVAILABLE_MESSAGE =
  "Kart ile ödeme şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
