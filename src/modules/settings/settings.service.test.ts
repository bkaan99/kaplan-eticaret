import { describe, expect, it } from "vitest";
import { SettingsService } from "./settings.service";
import {
  contactSettingsSchema,
  shippingSettingsSchema,
} from "./settings.schema";
import type { SettingsRepository } from "./settings.repository";
import { ValidationError } from "@/shared/errors";

function emptyRepo(
  overrides: Partial<SettingsRepository> = {},
): SettingsRepository {
  return {
    getContactSettingsRaw: async () => null,
    saveContactSettings: async () => undefined,
    getShippingSettingsRaw: async () => null,
    saveShippingSettings: async () => undefined,
    ...overrides,
  };
}

describe("contactSettingsSchema", () => {
  it("validates valid contact settings payload", () => {
    const valid = {
      phone: "+90 532 111 22 33",
      email: "destek@kaplantursu.com",
      whatsapp: "05321112233",
      address: "Çubuk, Ankara",
      workingHours: "09:00 - 18:00",
    };
    const result = contactSettingsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails when email is invalid", () => {
    const invalid = {
      phone: "+90 532 111 22 33",
      email: "not-an-email",
      address: "Çubuk, Ankara",
    };
    const result = contactSettingsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("shippingSettingsSchema", () => {
  it("accepts numeric threshold and flat rate", () => {
    const result = shippingSettingsSchema.safeParse({
      freeShippingThreshold: 750,
      flatRate: 59.9,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.freeShippingThreshold).toBe(750);
      expect(result.data.flatRate).toBe(59.9);
    }
  });

  it("rejects negative values", () => {
    const result = shippingSettingsSchema.safeParse({
      freeShippingThreshold: -1,
      flatRate: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe("SettingsService", () => {
  it("throws ValidationError when contact payload is invalid", async () => {
    const service = new SettingsService(emptyRepo());

    await expect(
      service.saveContactSettings(
        { phone: "", email: "not-an-email" },
        { userId: "admin-1" },
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("falls back to siteConfig shipping defaults when unset", async () => {
    const service = new SettingsService(emptyRepo());
    const shipping = await service.getShippingSettings();
    expect(shipping.freeShippingThreshold).toBeGreaterThan(0);
    expect(shipping.flatRate).toBeGreaterThan(0);
  });

  it("saves shipping settings and returns them", async () => {
    let stored: unknown = null;
    const service = new SettingsService(
      emptyRepo({
        getShippingSettingsRaw: async () =>
          stored as { freeShippingThreshold: number; flatRate: number } | null,
        saveShippingSettings: async (value) => {
          stored = value;
        },
      }),
    );

    await service.saveShippingSettings(
      { freeShippingThreshold: 800, flatRate: 39.9 },
      { userId: "admin-1" },
    );

    await expect(service.getShippingSettings()).resolves.toEqual({
      freeShippingThreshold: 800,
      flatRate: 39.9,
    });
  });

  it("throws ValidationError when shipping payload is invalid", async () => {
    const service = new SettingsService(emptyRepo());
    await expect(
      service.saveShippingSettings(
        { freeShippingThreshold: -5, flatRate: 10 },
        { userId: "admin-1" },
      ),
    ).rejects.toThrow(ValidationError);
  });
});
