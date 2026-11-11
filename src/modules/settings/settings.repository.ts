import { eq } from "drizzle-orm";
import { setting, type Db } from "@/db";
import type {
  ContactSettingsInput,
  ShippingSettingsInput,
} from "./settings.schema";

export const CONTACT_SETTINGS_KEY = "contact_settings";
export const SHIPPING_SETTINGS_KEY = "shipping_settings";

export interface SettingsRepository {
  /** Ham kayıt; yoksa null. */
  getContactSettingsRaw(): Promise<Partial<ContactSettingsInput> | null>;
  saveContactSettings(value: ContactSettingsInput): Promise<void>;
  getShippingSettingsRaw(): Promise<Partial<ShippingSettingsInput> | null>;
  saveShippingSettings(value: ShippingSettingsInput): Promise<void>;
}

export class D1SettingsRepository implements SettingsRepository {
  constructor(private readonly db: () => Db) {}

  private async getJsonRaw(
    key: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const [record] = await this.db()
        .select()
        .from(setting)
        .where(eq(setting.key, key))
        .limit(1);

      if (record?.value && typeof record.value === "object") {
        return record.value as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async saveJson(key: string, value: unknown): Promise<void> {
    await this.db()
      .insert(setting)
      .values({ key, value })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async getContactSettingsRaw(): Promise<Partial<ContactSettingsInput> | null> {
    return (await this.getJsonRaw(CONTACT_SETTINGS_KEY)) as Partial<ContactSettingsInput> | null;
  }

  async saveContactSettings(value: ContactSettingsInput): Promise<void> {
    await this.saveJson(CONTACT_SETTINGS_KEY, value);
  }

  async getShippingSettingsRaw(): Promise<Partial<ShippingSettingsInput> | null> {
    return (await this.getJsonRaw(SHIPPING_SETTINGS_KEY)) as Partial<ShippingSettingsInput> | null;
  }

  async saveShippingSettings(value: ShippingSettingsInput): Promise<void> {
    await this.saveJson(SHIPPING_SETTINGS_KEY, value);
  }
}
