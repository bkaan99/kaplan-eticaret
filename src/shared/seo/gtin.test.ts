import { describe, expect, it } from "vitest";
import { validGtin } from "./gtin";

describe("validGtin", () => {
  it("geçerli EAN-13'ü kabul eder", () => {
    expect(validGtin("8690504000013")).toBe("8690504000013");
  });

  it("boşluk ve tireleri temizler", () => {
    expect(validGtin("869 0504-000013")).toBe("8690504000013");
  });

  it("geçerli EAN-8'i kabul eder", () => {
    expect(validGtin("96385074")).toBe("96385074");
  });

  it("kontrol basamağı yanlışsa reddeder", () => {
    expect(validGtin("8690504000015")).toBeNull();
  });

  it("harf içeren veya yanlış uzunluktaki kodları reddeder", () => {
    expect(validGtin("TRS-001")).toBeNull();
    expect(validGtin("12345")).toBeNull();
    expect(validGtin(null)).toBeNull();
  });
});
