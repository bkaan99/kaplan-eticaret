import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import { SettingsService } from "./settings.service";

describe("SettingsService (veritabanı)", () => {
  let t: TestDb;
  let db: Db;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
  });

  afterAll(async () => {
    await t.close();
  });

  it("kayıt yoksa varsayılan iletişim ayarlarını döndürür", async () => {
    const settings = await new SettingsService(() => db).getContactSettings();

    expect(settings.phone).toBeDefined();
    expect(settings.email).toBeDefined();
    expect(settings.address).toBe("Çubuk, Ankara / Türkiye");
  });

  it("kaydeder, tekrar kaydedince üzerine yazar ve denetim kaydı bırakır", async () => {
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new SettingsService(() => db, audit as never);

    await service.saveContactSettings(
      {
        phone: "0850 111 22 33",
        email: "siparis@kaplan.com",
        address: "Çubuk Merkez",
      },
      { userId: "admin-1" },
    );
    await service.saveContactSettings(
      {
        phone: "0850 333 44 55",
        email: "iletisim@kaplantursu.com",
        address: "Ankara Caddesi No: 42, Çubuk",
        whatsapp: "05551112233",
        workingHours: "08:00 - 19:00",
      },
      { userId: "admin-1" },
    );

    const saved = await service.getContactSettings();
    expect(saved).toMatchObject({
      phone: "0850 333 44 55",
      email: "iletisim@kaplantursu.com",
      address: "Ankara Caddesi No: 42, Çubuk",
      whatsapp: "05551112233",
    });
    expect(audit.log).toHaveBeenCalledTimes(2);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settings.contact.update",
        actorId: "admin-1",
      }),
    );
  });
});
