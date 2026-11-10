import { withActor } from "@/shared/audit/audit-logger";
import { siteConfig } from "@/config/site.config";
import { ValidationError } from "@/shared/errors";
import type { Actor, AuditLogger } from "@/shared/audit";
import type { ShippingConfig } from "@/modules/checkout/shipping";
import {
  contactSettingsSchema,
  shippingSettingsSchema,
  type ContactSettingsInput,
  type ShippingSettingsInput,
} from "./settings.schema";
import type { SettingsRepository } from "./settings.repository";
import type { ContactSettings, ShippingSettings } from "./settings.types";

const DEFAULT_ADDRESS = "Çubuk, Ankara / Türkiye";

function toContactSettings(
  raw: Partial<ContactSettingsInput> | null,
): ContactSettings {
  return {
    phone: raw?.phone?.trim() || siteConfig.contact.phone,
    whatsapp: raw?.whatsapp?.trim() || null,
    email: raw?.email?.trim() || siteConfig.contact.email,
    address: raw?.address?.trim() || DEFAULT_ADDRESS,
    workingHours: raw?.workingHours?.trim() || "Hafta içi 08:30 - 18:00",
    instagramUrl: raw?.instagramUrl?.trim() || null,
    facebookUrl: raw?.facebookUrl?.trim() || null,
  };
}

function toShippingSettings(
  raw: Partial<ShippingSettingsInput> | null,
): ShippingSettings {
  return {
    freeShippingThreshold:
      typeof raw?.freeShippingThreshold === "number" &&
      Number.isFinite(raw.freeShippingThreshold)
        ? raw.freeShippingThreshold
        : siteConfig.shipping.freeShippingThreshold,
    flatRate:
      typeof raw?.flatRate === "number" && Number.isFinite(raw.flatRate)
        ? raw.flatRate
        : siteConfig.shipping.flatRate,
  };
}

export class SettingsService {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly audit?: AuditLogger,
  ) {}

  async getContactSettings(): Promise<ContactSettings> {
    const raw = await this.settings.getContactSettingsRaw();
    return toContactSettings(raw);
  }

  async saveContactSettings(raw: unknown, actor: Actor): Promise<void> {
    const parsed = contactSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Geçersiz iletişim ayarları",
      );
    }

    const before = await this.getContactSettings();
    await this.settings.saveContactSettings(parsed.data);

    await this.audit?.log(
      withActor(actor, {
        action: "settings.contact.update",
        entityType: "ContactSettings",
        before,
        after: parsed.data,
      }),
    );
  }

  async getShippingSettings(): Promise<ShippingSettings> {
    const raw = await this.settings.getShippingSettingsRaw();
    return toShippingSettings(raw);
  }

  /** Panel + siteConfig birleşimi; checkout ve beslemelerde kullanılır. */
  async getShippingConfig(): Promise<ShippingConfig> {
    const saved = await this.getShippingSettings();
    return {
      ...siteConfig.shipping,
      freeShippingThreshold: saved.freeShippingThreshold,
      flatRate: saved.flatRate,
    };
  }

  async saveShippingSettings(raw: unknown, actor: Actor): Promise<void> {
    const parsed = shippingSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Geçersiz kargo kuralları",
      );
    }

    const before = await this.getShippingSettings();
    await this.settings.saveShippingSettings(parsed.data);

    await this.audit?.log(
      withActor(actor, {
        action: "settings.shipping.update",
        entityType: "ShippingSettings",
        before,
        after: parsed.data,
      }),
    );
  }
}
