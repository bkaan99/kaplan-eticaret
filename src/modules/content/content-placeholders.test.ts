import { describe, expect, it } from "vitest";
import {
  fillContentPlaceholders,
  formatThresholdText,
} from "./content-placeholders";

describe("formatThresholdText", () => {
  it("tam tutarı kuruşsuz yazar", () => {
    expect(formatThresholdText(500)).toBe("500 TL");
  });
  it("binlik ayracı ve kuruşu Türkçe biçimler", () => {
    expect(formatThresholdText(1500)).toBe("1.500 TL");
    expect(formatThresholdText(499.9)).toBe("499,9 TL");
  });
});

describe("fillContentPlaceholders", () => {
  it("tüm yer tutucuları güncel eşikle değiştirir", () => {
    const text =
      "**{{ucretsiz_kargo_esigi}} ve üzeri** ücretsiz; {{ucretsiz_kargo_esigi}} altı ücretli.";
    expect(fillContentPlaceholders(text, { freeShippingThreshold: 750 })).toBe(
      "**750 TL ve üzeri** ücretsiz; 750 TL altı ücretli.",
    );
  });
  it("yer tutucu yoksa metne dokunmaz", () => {
    expect(
      fillContentPlaceholders("Merhaba", { freeShippingThreshold: 500 }),
    ).toBe("Merhaba");
  });
});
