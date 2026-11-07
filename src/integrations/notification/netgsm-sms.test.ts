import { describe, expect, it, vi } from "vitest";
import {
  NETGSM_SEND_URL,
  normalizeTrMobile,
  sendNetgsmSms,
} from "./netgsm-sms";

describe("normalizeTrMobile", () => {
  it.each([
    ["0507 542 03 01", "5075420301"],
    ["+90 (507) 542-0301", "5075420301"],
    ["905075420301", "5075420301"],
    ["5075420301", "5075420301"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeTrMobile(input)).toBe(expected);
  });

  it("sabit hat ve eksik numaraları reddeder", () => {
    expect(normalizeTrMobile("0312 555 44 33")).toBeNull();
    expect(normalizeTrMobile("0507 542")).toBeNull();
    expect(normalizeTrMobile("")).toBeNull();
    expect(normalizeTrMobile(null)).toBeNull();
  });
});

const config = {
  usercode: "8503000000",
  password: "gizli",
  msgheader: "KAPLAN",
};

function response(status: number, body: string) {
  return { ok: status < 400, status, text: async () => body };
}

describe("sendNetgsmSms", () => {
  it("Basic auth ve JSON gövdeyle gönderir, jobid döner", async () => {
    const fetchImpl = vi.fn(async () =>
      response(200, '{"code":"00","jobid":"123"}'),
    );

    const result = await sendNetgsmSms(
      config,
      { to: "5075420301", text: "Siparişiniz kargoda" },
      fetchImpl,
    );

    expect(result).toEqual({ jobId: "123" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toBe(NETGSM_SEND_URL);
    expect(init.headers["Authorization"]).toBe(
      `Basic ${btoa("8503000000:gizli")}`,
    );
    expect(JSON.parse(init.body)).toEqual({
      msgheader: "KAPLAN",
      encoding: "TR",
      iysfilter: "0",
      messages: [{ msg: "Siparişiniz kargoda", no: "5075420301" }],
    });
  });

  it("Netgsm hata kodunda hata fırlatır (kuyruk yeniden denesin)", async () => {
    const fetchImpl = vi.fn(async () =>
      response(200, '{"code":"30","description":"Geçersiz kullanıcı"}'),
    );
    await expect(
      sendNetgsmSms(config, { to: "5075420301", text: "x" }, fetchImpl),
    ).rejects.toThrow(/kod 30.*Geçersiz kullanıcı/);
  });

  it("JSON olmayan hata yanıtını da raporlar", async () => {
    const fetchImpl = vi.fn(async () => response(500, "Internal Error"));
    await expect(
      sendNetgsmSms(config, { to: "5075420301", text: "x" }, fetchImpl),
    ).rejects.toThrow(/HTTP 500.*Internal Error/);
  });
});
