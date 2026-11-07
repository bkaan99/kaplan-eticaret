import { ForbiddenError, ValidationError } from "@/shared/errors";
import {
  CARD_UNAVAILABLE_MESSAGE,
  providerKindFor,
  type PaymentMode,
} from "./payment-mode";
import type {
  PaymentCallbackResult,
  PaymentInitRequest,
  PaymentInitResult,
  PaymentProvider,
  RefundRequest,
  RefundResult,
} from "./payment-provider";

export interface PaymentGatewayDeps {
  /** Panelde seçili ödeme modu */
  getMode(): Promise<PaymentMode>;
  /** Ödemenin kaydedildiği sağlayıcı ("dev" | "paytr"); kayıt yoksa null */
  providerOf(merchantOid: string): Promise<string | null>;
  /** Sahte sağlayıcı (her zaman kullanılabilir) */
  dev: PaymentProvider;
  /** PayTR sağlayıcısı; anahtar tanımlı değilse null. `sandbox` PayTR test modudur. */
  paytr(sandbox: boolean): PaymentProvider | null;
}

/**
 * Ödeme çağrılarını yönetim panelindeki moda göre doğru sağlayıcıya yönlendirir.
 *
 * - Yeni ödemeler (`initiate`) seçili moda göre açılır; anahtar yoksa kart ödemesi kapanır (fail-closed).
 * - Bildirim ve iade, ödemenin KAYITLI sağlayıcısına gider: mod sonradan değişse de PayTR ile
 *   alınmış bir ödeme sahte sağlayıcıyla iade edilmez, sahte bir bildirim de gerçek siparişi ödemez.
 * - Sahte (dev) bildirim yalnızca test modundayken kabul edilir.
 */
export class PaymentGateway implements PaymentProvider {
  readonly name = "gateway";

  constructor(private readonly deps: PaymentGatewayDeps) {}

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResult> {
    const mode = await this.deps.getMode();
    const paytr = this.deps.paytr(mode === "PAYTR_TEST");
    const kind = providerKindFor(mode, paytr !== null);

    if (kind === "dev") return this.deps.dev.initiate(request);
    if (kind === "paytr" && paytr) return paytr.initiate(request);
    throw new ValidationError(CARD_UNAVAILABLE_MESSAGE);
  }

  async verifyCallback(
    payload: Record<string, string>,
  ): Promise<PaymentCallbackResult> {
    const merchantOid = payload["merchant_oid"] ?? "";
    const recorded = merchantOid
      ? await this.deps.providerOf(merchantOid)
      : null;
    const mode = await this.deps.getMode();

    // Kayıt bulunamazsa mevcut modun sağlayıcısı denenir (bilinmeyen sipariş → servis "not-found" der).
    const provider = recorded ?? (mode === "FAKE" ? "dev" : "paytr");

    if (provider === "dev") {
      if (mode !== "FAKE") {
        throw new ForbiddenError("Test ödemesi şu anda kapalı");
      }
      return this.deps.dev.verifyCallback(payload);
    }

    const paytr = this.deps.paytr(false);
    if (!paytr) throw new ValidationError("PayTR yapılandırılmamış");
    return paytr.verifyCallback(payload);
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    const recorded = await this.deps.providerOf(request.merchantOid);

    if (recorded === "dev") return this.deps.dev.refund(request);

    const paytr = this.deps.paytr(false);
    if (!paytr) {
      throw new ValidationError(
        "PayTR anahtarları tanımlı olmadığı için iade yapılamıyor",
      );
    }
    return paytr.refund(request);
  }
}
