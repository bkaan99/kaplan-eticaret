import { describe, expect, it } from "vitest";
import { freeShippingProgress } from "./shipping";

describe("freeShippingProgress", () => {
  it("limitin altında kalan tutarı ve yüzdeyi hesaplar", () => {
    expect(freeShippingProgress("415.00", 500)).toEqual({
      reached: false,
      remaining: "85.00",
      percent: 83,
    });
  });

  it("kuruşlu tutarlarda kayan nokta hatası üretmez", () => {
    expect(freeShippingProgress("249.90", 500).remaining).toBe("250.10");
  });

  it("limite ulaşınca ücretsiz kargo verir", () => {
    expect(freeShippingProgress("500", 500)).toEqual({
      reached: true,
      remaining: "0.00",
      percent: 100,
    });
  });

  it("limite çok yakınken çubuğu tam doldurmaz", () => {
    expect(freeShippingProgress("499.99", 500).percent).toBe(99);
  });

  it("limit tanımlı değilse (0) her sepet ücretsiz kargoludur", () => {
    expect(freeShippingProgress("10", 0).reached).toBe(true);
  });
});
