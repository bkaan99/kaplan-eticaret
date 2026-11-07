import { describe, expect, it, vi } from "vitest";
import { PaymentGateway } from "./payment-gateway";
import type { PaymentMode } from "./payment-mode";
import type { PaymentProvider } from "./payment-provider";

function fakeProvider(name: string): PaymentProvider & {
  initiate: ReturnType<typeof vi.fn>;
  verifyCallback: ReturnType<typeof vi.fn>;
  refund: ReturnType<typeof vi.fn>;
} {
  return {
    name,
    initiate: vi.fn(async () => ({
      token: name,
      paymentUrl: `https://${name}/pay`,
      mode: "redirect" as const,
    })),
    verifyCallback: vi.fn(() => ({
      merchantOid: "S1",
      status: "success" as const,
      amount: "10.00",
      failureReason: null,
    })),
    refund: vi.fn(async () => ({ providerRef: name })),
  };
}

const REQUEST = {
  merchantOid: "S1",
  amount: "10.00",
  currency: "TRY",
  email: "a@b.c",
  customerName: "A B",
  customerPhone: "1",
  customerAddress: "x",
  customerIp: "1.1.1.1",
  description: "d",
  okUrl: "https://ok",
  failUrl: "https://fail",
};

function setup(options: {
  mode: PaymentMode;
  paytrConfigured?: boolean;
  recorded?: string | null;
}) {
  const dev = fakeProvider("dev");
  const paytr = fakeProvider("paytr");
  const sandboxFlags: boolean[] = [];
  const gateway = new PaymentGateway({
    getMode: async () => options.mode,
    providerOf: async () => options.recorded ?? null,
    dev,
    paytr: (sandbox) => {
      sandboxFlags.push(sandbox);
      return options.paytrConfigured === false ? null : paytr;
    },
  });
  return { gateway, dev, paytr, sandboxFlags };
}

describe("PaymentGateway.initiate", () => {
  it("test modunda sahte sağlayıcıyı kullanır (PayTR anahtarı olmasa da)", async () => {
    const { gateway, dev, paytr } = setup({ mode: "FAKE", paytrConfigured: false });
    expect((await gateway.initiate(REQUEST)).paymentUrl).toBe("https://dev/pay");
    expect(dev.initiate).toHaveBeenCalledTimes(1);
    expect(paytr.initiate).not.toHaveBeenCalled();
  });

  it("canlı modda PayTR'yi gerçek (sandbox olmayan) ayarla çağırır", async () => {
    const { gateway, paytr, sandboxFlags } = setup({ mode: "LIVE" });
    await gateway.initiate(REQUEST);
    expect(paytr.initiate).toHaveBeenCalledTimes(1);
    expect(sandboxFlags).toContain(false);
  });

  it("PayTR test modunda sandbox ile çağırır", async () => {
    const { gateway, sandboxFlags } = setup({ mode: "PAYTR_TEST" });
    await gateway.initiate(REQUEST);
    expect(sandboxFlags).toContain(true);
  });

  it("canlı modda PayTR anahtarı yoksa sahte sağlayıcıya DÜŞMEZ, kart kapanır", async () => {
    const { gateway, dev } = setup({ mode: "LIVE", paytrConfigured: false });
    await expect(gateway.initiate(REQUEST)).rejects.toThrow(/kullanılamıyor/);
    expect(dev.initiate).not.toHaveBeenCalled();
  });
});

describe("PaymentGateway.verifyCallback", () => {
  const payload = { merchant_oid: "S1", status: "success" };

  it("kayıtlı sağlayıcıya göre doğrular: dev ödeme yalnızca test modunda kabul edilir", async () => {
    const fake = setup({ mode: "FAKE", recorded: "dev" });
    await fake.gateway.verifyCallback(payload);
    expect(fake.dev.verifyCallback).toHaveBeenCalledTimes(1);

    const live = setup({ mode: "LIVE", recorded: "dev" });
    await expect(live.gateway.verifyCallback(payload)).rejects.toThrow(/kapalı/);
    expect(live.dev.verifyCallback).not.toHaveBeenCalled();
  });

  it("PayTR ile açılmış ödemenin bildirimi, mod sonradan test'e dönse de PayTR ile doğrulanır", async () => {
    const { gateway, paytr, dev } = setup({ mode: "FAKE", recorded: "paytr" });
    await gateway.verifyCallback(payload);
    expect(paytr.verifyCallback).toHaveBeenCalledTimes(1);
    expect(dev.verifyCallback).not.toHaveBeenCalled();
  });

  it("PayTR bildirimi anahtar yokken reddedilir", async () => {
    const { gateway } = setup({
      mode: "LIVE",
      recorded: "paytr",
      paytrConfigured: false,
    });
    await expect(gateway.verifyCallback(payload)).rejects.toThrow(/yapılandırılmamış/);
  });
});

describe("PaymentGateway.refund", () => {
  it("iade, ödemenin kayıtlı sağlayıcısına gider (mod fark etmez)", async () => {
    const real = setup({ mode: "FAKE", recorded: "paytr" });
    await real.gateway.refund({ merchantOid: "S1", amount: "5.00" });
    expect(real.paytr.refund).toHaveBeenCalledTimes(1);
    expect(real.dev.refund).not.toHaveBeenCalled();

    const fake = setup({ mode: "LIVE", recorded: "dev" });
    await fake.gateway.refund({ merchantOid: "S1", amount: "5.00" });
    expect(fake.dev.refund).toHaveBeenCalledTimes(1);
    expect(fake.paytr.refund).not.toHaveBeenCalled();
  });

  it("PayTR ödemesi anahtar yokken iade edilemez", async () => {
    const { gateway } = setup({ mode: "LIVE", recorded: "paytr", paytrConfigured: false });
    await expect(gateway.refund({ merchantOid: "S1", amount: "5.00" })).rejects.toThrow(
      /iade yapılamıyor/,
    );
  });
});
