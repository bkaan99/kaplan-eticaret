import { describe, expect, it } from "vitest";
import { judgePaymentResult } from "./payment-result.policy";

describe("judgePaymentResult", () => {
  it("başarılı ve tutar eşleşiyorsa paid", () => {
    expect(judgePaymentResult(true, true)).toBe("paid");
  });
  it("başarılı ama tutar uyuşmuyorsa amount-mismatch", () => {
    expect(judgePaymentResult(true, false)).toBe("amount-mismatch");
  });
  it("sağlayıcı başarısız dediyse tutardan bağımsız failed", () => {
    expect(judgePaymentResult(false, true)).toBe("failed");
    expect(judgePaymentResult(false, false)).toBe("failed");
  });
});
