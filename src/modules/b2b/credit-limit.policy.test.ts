import { describe, expect, it } from "vitest";
import { CreditLimitPolicy } from "./credit-limit.policy";

describe("CreditLimitPolicy", () => {
  it("kullanılan + talep edilen limitin altındaysa onay verir", () => {
    const result = CreditLimitPolicy.evaluate("200.00", "300.00", "1000.00");
    expect(result.hasEnoughCredit).toBe(true);
    expect(result.available.toNumber()).toBe(800);
    expect(() =>
      CreditLimitPolicy.assertAllowed("200.00", "300.00", "1000.00"),
    ).not.toThrow();
  });

  it("limit tam dolduğunda onay verir", () => {
    const result = CreditLimitPolicy.evaluate("500.00", "500.00", "1000.00");
    expect(result.hasEnoughCredit).toBe(true);
    expect(result.available.toNumber()).toBe(500);
    expect(() =>
      CreditLimitPolicy.assertAllowed("500.00", "500.00", "1000.00"),
    ).not.toThrow();
  });

  it("limit aşıldığında false döner ve assertAllowed ConflictError fırlatır", () => {
    const result = CreditLimitPolicy.evaluate("600.00", "500.00", "1000.00");
    expect(result.hasEnoughCredit).toBe(false);
    expect(result.available.toNumber()).toBe(400);
    expect(() =>
      CreditLimitPolicy.assertAllowed("600.00", "500.00", "1000.00"),
    ).toThrow("Kredi limitiniz yetersiz (kullanılabilir: 400.00 TL)");
  });

  it("kullanım limiti zaten aşmışsa kalan limit 0 olarak hesaplanır", () => {
    const result = CreditLimitPolicy.evaluate("1200.00", "100.00", "1000.00");
    expect(result.hasEnoughCredit).toBe(false);
    expect(result.available.toNumber()).toBe(0);
    expect(() =>
      CreditLimitPolicy.assertAllowed("1200.00", "100.00", "1000.00"),
    ).toThrow("Kredi limitiniz yetersiz (kullanılabilir: 0.00 TL)");
  });

  it("limit 0 veya tanımsızsa kredi kullanımına izin vermez", () => {
    const result = CreditLimitPolicy.evaluate("0", "100.00", "0");
    expect(result.hasEnoughCredit).toBe(false);
    expect(() =>
      CreditLimitPolicy.assertAllowed("0", "100.00", "0"),
    ).toThrow("Kredi limitiniz yetersiz");
  });
});
