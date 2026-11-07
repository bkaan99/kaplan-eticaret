import { describe, expect, it, vi } from "vitest";
import type { PaymentModeRepository } from "./payment-mode.repository";
import { PaymentModeService } from "./payment-mode.service";

function repo(initial: string | null): PaymentModeRepository & { saved: string[] } {
  let value = initial;
  const saved: string[] = [];
  return {
    saved,
    get: async () => value,
    save: async (mode) => {
      value = mode;
      saved.push(mode);
    },
    providerOf: async () => null,
  };
}

const actor = { userId: "admin-1", ip: "1.1.1.1" };

describe("PaymentModeService", () => {
  it("kayıt yokken veya bozuk kayıtta varsayılan test modudur", async () => {
    expect(await new PaymentModeService(repo(null), () => true).get()).toBe("FAKE");
    expect(await new PaymentModeService(repo("bozuk"), () => true).get()).toBe("FAKE");
  });

  it("modu kaydeder, hemen yansıtır ve denetim kaydı bırakır", async () => {
    const audit = { log: vi.fn(async () => {}), purgeOlderThan: async () => 0 };
    const store = repo("FAKE");
    const service = new PaymentModeService(store, () => true, audit);

    expect(await service.get()).toBe("FAKE");
    await service.setMode("LIVE", actor);

    expect(await service.get()).toBe("LIVE");
    expect(store.saved).toEqual(["LIVE"]);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settings.payment_mode.update",
        actorId: "admin-1",
        before: expect.objectContaining({ mode: "FAKE" }),
        after: expect.objectContaining({ mode: "LIVE" }),
      }),
    );
  });

  it("aynı modu tekrar kaydedince denetim kaydı eklemez", async () => {
    const audit = { log: vi.fn(async () => {}), purgeOlderThan: async () => 0 };
    await new PaymentModeService(repo("FAKE"), () => true, audit).setMode("FAKE", actor);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it("PayTR anahtarı yokken canlı veya PayTR test seçilemez, test modu seçilebilir", async () => {
    const store = repo("FAKE");
    const service = new PaymentModeService(store, () => false);

    await expect(service.setMode("LIVE", actor)).rejects.toThrow(/anahtarları tanımlı değil/);
    await expect(service.setMode("PAYTR_TEST", actor)).rejects.toThrow(/anahtarları tanımlı değil/);
    expect(store.saved).toEqual([]);

    await expect(service.setMode("FAKE", actor)).resolves.toBe("FAKE");
  });

  it("geçersiz modu reddeder", async () => {
    await expect(
      new PaymentModeService(repo(null), () => true).setMode("HERKESE_BEDAVA", actor),
    ).rejects.toThrow(/Geçersiz/);
  });
});
