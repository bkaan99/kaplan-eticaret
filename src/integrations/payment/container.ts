import { getPaymentModeService } from "@/modules/settings/container";
import { getEnv } from "@/shared/env";
import { getSiteUrl } from "@/shared/site-url";
import { DevPaymentProvider } from "./dev/dev-payment-provider";
import { PaymentGateway } from "./payment-gateway";
import { providerKindFor, type ProviderKind } from "./payment-mode";
import { PaytrProvider } from "./paytr/paytr-provider";

let gateway: PaymentGateway | undefined;
let devProvider: DevPaymentProvider | undefined;
const paytrProviders = new Map<boolean, PaytrProvider>();

function getDev(): DevPaymentProvider {
  const env = getEnv();
  devProvider ??= new DevPaymentProvider(env.AUTH_SECRET, getSiteUrl());
  return devProvider;
}

/** PayTR sağlayıcısı; anahtarlar tanımlı değilse null. `sandbox`: PayTR test modu. */
function getPaytr(sandbox: boolean): PaytrProvider | null {
  const env = getEnv();
  if (
    !env.PAYTR_MERCHANT_ID ||
    !env.PAYTR_MERCHANT_KEY ||
    !env.PAYTR_MERCHANT_SALT
  ) {
    return null;
  }
  let provider = paytrProviders.get(sandbox);
  if (!provider) {
    provider = new PaytrProvider(
      {
        merchantId: env.PAYTR_MERCHANT_ID,
        merchantKey: env.PAYTR_MERCHANT_KEY,
        merchantSalt: env.PAYTR_MERCHANT_SALT,
      },
      { testMode: sandbox },
    );
    paytrProviders.set(sandbox, provider);
  }
  return provider;
}

/**
 * Tüm ödeme çağrılarının tek girişi. Hangi sağlayıcının kullanılacağı yönetim panelindeki
 * ödeme moduna göre her çağrıda belirlenir (bkz. PaymentGateway).
 */
export function getPaymentProvider(): PaymentGateway {
  gateway ??= new PaymentGateway({
    getMode: () => getPaymentModeService().get(),
    providerOf: (merchantOid) =>
      getPaymentModeService().providerOf(merchantOid),
    dev: getDev(),
    paytr: getPaytr,
  });
  return gateway;
}

/** Şu anki mod için kart ödemesinin hangi sağlayıcıyla alınacağı (`unavailable`: kapalı). */
export async function getCardProviderKind(): Promise<ProviderKind> {
  const mode = await getPaymentModeService().get();
  return providerKindFor(mode, getPaytr(false) !== null);
}

/** Sahte ödeme sayfası ve işlemi yalnızca test modundayken kullanılabilir. */
export async function getDevPaymentProvider(): Promise<DevPaymentProvider | null> {
  const mode = await getPaymentModeService().get();
  return mode === "FAKE" ? getDev() : null;
}
