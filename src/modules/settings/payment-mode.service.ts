import {
  DEFAULT_PAYMENT_MODE,
  isPaymentMode,
  PAYMENT_MODE_LABELS,
  type PaymentMode,
} from "@/integrations/payment/payment-mode";
import { ValidationError } from "@/shared/errors";
import type { Actor, AuditLogger } from "@/shared/audit";
import { TtlCache } from "@/shared/cache/ttl-cache";
import type { PaymentModeRepository } from "./payment-mode.repository";

/** Mod okuması isolate başına kısa süre ezberlenir; kayıt sonrası bu örnekte hemen temizlenir. */
const MODE_TTL_MS = 10_000;

export class PaymentModeService {
  private readonly cache: TtlCache<"mode", PaymentMode>;

  constructor(
    private readonly repository: PaymentModeRepository,
    /** PayTR anahtarları (PAYTR_MERCHANT_ID/KEY/SALT) tanımlı mı? */
    private readonly paytrConfigured: () => boolean,
    private readonly audit?: AuditLogger,
  ) {
    this.cache = new TtlCache(async () => {
      const raw = await this.repository.get();
      return isPaymentMode(raw) ? raw : DEFAULT_PAYMENT_MODE;
    }, MODE_TTL_MS);
  }

  get(): Promise<PaymentMode> {
    return this.cache.get("mode");
  }

  isPaytrConfigured(): boolean {
    return this.paytrConfigured();
  }

  providerOf(merchantOid: string): Promise<string | null> {
    return this.repository.providerOf(merchantOid);
  }

  async setMode(raw: unknown, actor: Actor): Promise<PaymentMode> {
    if (!isPaymentMode(raw)) throw new ValidationError("Geçersiz ödeme modu");
    if (raw !== "FAKE" && !this.paytrConfigured()) {
      throw new ValidationError(
        "PayTR anahtarları tanımlı değil. Önce PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT gizli anahtarlarını Cloudflare'de ekleyin.",
      );
    }

    // Önbellekten değil kayıttan okunur: karşılaştırma ve denetim kaydı güncel değere dayanır.
    const storedRaw = await this.repository.get();
    const before = isPaymentMode(storedRaw) ? storedRaw : DEFAULT_PAYMENT_MODE;
    await this.repository.save(raw);
    this.cache.invalidate();

    if (before !== raw) {
      await this.audit?.log({
        actorId: actor.userId,
        ip: actor.ip,
        action: "settings.payment_mode.update",
        entityType: "PaymentMode",
        before: { mode: before, label: PAYMENT_MODE_LABELS[before] },
        after: { mode: raw, label: PAYMENT_MODE_LABELS[raw] },
      });
    }
    return raw;
  }
}
