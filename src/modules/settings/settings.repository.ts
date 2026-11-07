import { eq } from "drizzle-orm";
import { setting, type Db } from "@/db";
import type { ContactSettingsInput } from "./settings.schema";

export const CONTACT_SETTINGS_KEY = "contact_settings";

export interface SettingsRepository {
  /** Ham kayıt; yoksa null. */
  getContactSettingsRaw(): Promise<Partial<ContactSettingsInput> | null>;
  saveContactSettings(value: ContactSettingsInput): Promise<void>;
}

export class D1SettingsRepository implements SettingsRepository {
  constructor(private readonly db: () => Db) {}

  async getContactSettingsRaw(): Promise<Partial<ContactSettingsInput> | null> {
    try {
      const [record] = await this.db()
        .select()
        .from(setting)
        .where(eq(setting.key, CONTACT_SETTINGS_KEY))
        .limit(1);

      if (record?.value && typeof record.value === "object") {
        return record.value as Partial<ContactSettingsInput>;
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveContactSettings(value: ContactSettingsInput): Promise<void> {
    await this.db()
      .insert(setting)
      .values({ key: CONTACT_SETTINGS_KEY, value })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value, updatedAt: new Date() },
      });
  }
}
