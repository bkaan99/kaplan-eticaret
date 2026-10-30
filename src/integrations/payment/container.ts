import { getEnv } from "@/shared/env";
import { getSiteUrl } from "@/shared/site-url";
import { DevPaymentProvider } from "./dev/dev-payment-provider";
import type { PaymentProvider } from "./payment-provider";
import { PaytrProvider } from "./paytr/paytr-provider";

let paymentProvider: PaymentProvider | undefined;

/** PayTR anahtarları tanımlıysa PayTR, yoksa (yalnızca geliştirmede) sahte sağlayıcı. */
export function getPaymentProvider(): PaymentProvider {
  if (paymentProvider) return paymentProvider;

  const env = getEnv();
  if (
    env.PAYTR_MERCHANT_ID &&
    env.PAYTR_MERCHANT_KEY &&
    env.PAYTR_MERCHANT_SALT
  ) {
    paymentProvider = new PaytrProvider(
      {
        merchantId: env.PAYTR_MERCHANT_ID,
        merchantKey: env.PAYTR_MERCHANT_KEY,
        merchantSalt: env.PAYTR_MERCHANT_SALT,
      },
      { testMode: env.NODE_ENV !== "production" || env.PAYTR_TEST_MODE },
    );
  } else {
    paymentProvider = new DevPaymentProvider(env.AUTH_SECRET, getSiteUrl());
  }

  return paymentProvider;
}

export function getDevPaymentProvider(): DevPaymentProvider | null {
  const provider = getPaymentProvider();
  return provider instanceof DevPaymentProvider ? provider : null;
}
