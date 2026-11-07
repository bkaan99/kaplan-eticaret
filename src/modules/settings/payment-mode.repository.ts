import { eq } from "drizzle-orm";
import { payment, setting, type Db } from "@/db";

export const PAYMENT_MODE_KEY = "payment_mode";

export interface PaymentModeRepository {
  /** Kayıtlı ham değer; yoksa null. */
  get(): Promise<string | null>;
  save(mode: string): Promise<void>;
  /** Ödemenin kaydedildiği sağlayıcı (`payments.provider`); yoksa null. */
  providerOf(merchantOid: string): Promise<string | null>;
}

export class D1PaymentModeRepository implements PaymentModeRepository {
  constructor(private readonly db: () => Db) {}

  async get(): Promise<string | null> {
    const [record] = await this.db()
      .select()
      .from(setting)
      .where(eq(setting.key, PAYMENT_MODE_KEY))
      .limit(1);
    const value = record?.value as { mode?: unknown } | null | undefined;
    return typeof value?.mode === "string" ? value.mode : null;
  }

  async save(mode: string): Promise<void> {
    await this.db()
      .insert(setting)
      .values({ key: PAYMENT_MODE_KEY, value: { mode } })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value: { mode }, updatedAt: new Date() },
      });
  }

  async providerOf(merchantOid: string): Promise<string | null> {
    const [row] = await this.db()
      .select({ provider: payment.provider })
      .from(payment)
      .where(eq(payment.merchantOid, merchantOid))
      .limit(1);
    return row?.provider ?? null;
  }
}
