import { describe, expect, it, vi } from "vitest";
import { SettingsService } from "./settings.service";
import { contactSettingsSchema } from "./settings.schema";
import type { PrismaClient } from "@/shared/prisma-client";
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
  it("returns fallback contact settings if none is saved in database", async () => {
    const mockDb = {
      setting: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
    } as unknown as PrismaClient;

    const service = new SettingsService(() => mockDb);
    const settings = await service.getContactSettings();

    expect(settings.phone).toBeDefined();
    expect(settings.email).toBeDefined();
    expect(settings.address).toBe("Çubuk, Ankara / Türkiye");
  });

  it("returns saved contact settings from db if present", async () => {
    const mockDb = {
      setting: {
        findUnique: vi.fn().mockResolvedValue({
          key: "contact_settings",
          value: {
            phone: "0850 333 44 55",
            email: "iletisim@kaplantursu.com",
            address: "Ankara Caddesi No: 42, Çubuk",
            whatsapp: "05551112233",
            workingHours: "08:00 - 19:00",
          },
        }),
        upsert: vi.fn(),
      },
    } as unknown as PrismaClient;

    const service = new SettingsService(() => mockDb);
    const settings = await service.getContactSettings();

    expect(settings.phone).toBe("0850 333 44 55");
    expect(settings.email).toBe("iletisim@kaplantursu.com");
    expect(settings.address).toBe("Ankara Caddesi No: 42, Çubuk");
    expect(settings.whatsapp).toBe("05551112233");
  });

  it("saves contact settings and logs audit event", async () => {
    const upsertMock = vi.fn().mockResolvedValue({});
    const mockDb = {
      setting: {
        findUnique: vi.fn(),
        upsert: upsertMock,
      },
    } as unknown as PrismaClient;
    const auditMock = { log: vi.fn().mockResolvedValue(undefined) };

    const service = new SettingsService(() => mockDb, auditMock as any);
    await service.saveContactSettings(
      {
        phone: "0850 111 22 33",
        email: "siparis@kaplan.com",
        address: "Çubuk Merkez",
      },
      { userId: "admin-1" },
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "contact_settings" },
        update: expect.objectContaining({
          value: expect.objectContaining({
            phone: "0850 111 22 33",
            email: "siparis@kaplan.com",
          }),
        }),
      }),
    );
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settings.contact.update",
        actorId: "admin-1",
      }),
    );
  });

  it("throws ValidationError when payload is invalid", async () => {
    const mockDb = {} as unknown as PrismaClient;
    const service = new SettingsService(() => mockDb);

    await expect(
      service.saveContactSettings(
        { phone: "", email: "not-an-email" },
        { userId: "admin-1" },
      ),
    ).rejects.toThrow(ValidationError);
  });
});
