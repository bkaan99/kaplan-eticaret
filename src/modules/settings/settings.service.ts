import { siteConfig } from "@/config/site.config";
import { ValidationError } from "@/shared/errors";
import { eq } from "drizzle-orm";
import { setting, type Db } from "@/db";
import type { Actor, AuditLogger } from "@/shared/audit";
import {
  contactSettingsSchema,
  type ContactSettingsInput,
} from "./settings.schema";
import type { ContactSettings } from "./settings.types";

const CONTACT_SETTINGS_KEY = "contact_settings";
const DEFAULT_ADDRESS = "Çubuk, Ankara / Türkiye";

export class SettingsService {
  constructor(
    private readonly db: () => Db,
    private readonly audit?: AuditLogger,
  ) {}

  async getContactSettings(): Promise<ContactSettings> {
    try {
      const [record] = await this.db()
        .select()
        .from(setting)
        .where(eq(setting.key, CONTACT_SETTINGS_KEY))
        .limit(1);

      if (record && record.value && typeof record.value === "object") {
        const val = record.value as Partial<ContactSettings>;
        return {
          phone: val.phone?.trim() || siteConfig.contact.phone,
          whatsapp: val.whatsapp?.trim() || null,
          email: val.email?.trim() || siteConfig.contact.email,
          address: val.address?.trim() || DEFAULT_ADDRESS,
          workingHours: val.workingHours?.trim() || "Hafta içi 08:30 - 18:00",
          instagramUrl: val.instagramUrl?.trim() || null,
          facebookUrl: val.facebookUrl?.trim() || null,
        };
      }
    } catch {
      // Veritabanı okunamadığında siteConfig varsayılanlarına dön
    }

    return {
      phone: siteConfig.contact.phone,
      whatsapp: null,
      email: siteConfig.contact.email,
      address: DEFAULT_ADDRESS,
      workingHours: "Hafta içi 08:30 - 18:00",
      instagramUrl: null,
      facebookUrl: null,
    };
  }

  async saveContactSettings(raw: unknown, actor: Actor): Promise<void> {
    const parsed = contactSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Geçersiz iletişim ayarları",
      );
    }

    const before = await this.getContactSettings();
    await this.db()
      .insert(setting)
      .values({ key: CONTACT_SETTINGS_KEY, value: parsed.data })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value: parsed.data, updatedAt: new Date() },
      });

    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: "settings.contact.update",
      entityType: "ContactSettings",
      before,
      after: parsed.data,
    });
  }
}
