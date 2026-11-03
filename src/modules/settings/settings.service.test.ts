import { describe, expect, it } from "vitest";
import { SettingsService } from "./settings.service";
import { contactSettingsSchema } from "./settings.schema";
import type { SettingsRepository } from "./settings.repository";
import { ValidationError } from "@/shared/errors";

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

describe("SettingsService", () => {
  it("throws ValidationError when payload is invalid", async () => {
    const repo: SettingsRepository = {
      getContactSettingsRaw: async () => null,
      saveContactSettings: async () => undefined,
    };
    const service = new SettingsService(repo);

    await expect(
      service.saveContactSettings(
        { phone: "", email: "not-an-email" },
        { userId: "admin-1" },
      ),
    ).rejects.toThrow(ValidationError);
  });
});
