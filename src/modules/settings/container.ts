import { getDb } from "@/shared/db";
import { getAuditLogger } from "@/shared/audit";
import { getEnv } from "@/shared/env";
import { D1PaymentModeRepository } from "./payment-mode.repository";
import { PaymentModeService } from "./payment-mode.service";
import { D1SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";

export const settingsService = new SettingsService(
  new D1SettingsRepository(getDb),
  getAuditLogger(),
);

let paymentModeService: PaymentModeService | undefined;

/** Ödeme modu (panelden seçilir). Tek örnek: mod ezberi isolate başına paylaşılır. */
export function getPaymentModeService(): PaymentModeService {
  paymentModeService ??= new PaymentModeService(
    new D1PaymentModeRepository(getDb),
    () => {
      const env = getEnv();
      return Boolean(
        env.PAYTR_MERCHANT_ID &&
        env.PAYTR_MERCHANT_KEY &&
        env.PAYTR_MERCHANT_SALT,
      );
    },
    getAuditLogger(),
  );
  return paymentModeService;
}
