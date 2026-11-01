import { describe, expect, it } from "vitest";
import {
  formatMoney,
  fromDesiMilli,
  fromMinor,
  fromPercentUnits,
  roundMoney,
  toDecimal,
  toDesiMilli,
  toMinor,
  toPercentUnits,
} from "./money";

describe("money", () => {
  it("number kaynaklı kayan nokta hatası üretmez", () => {
    const total = toDecimal("0.1").plus("0.2");
    expect(total.toString()).toBe("0.3");
  });

  it("yarıdan yukarı 2 basamağa yuvarlar", () => {
    expect(roundMoney("10.005").toFixed(2)).toBe("10.01");
    expect(roundMoney("10.004").toFixed(2)).toBe("10.00");
  });

  it("TL olarak Türkçe biçimlendirir", () => {
    const formatted = formatMoney("1234.5");
    expect(formatted).toContain("1.234,50");
    expect(formatted).toContain("₺");
  });

  it("kuruş (minor) dönüşümü yuvarlar", () => {
    expect(toMinor("19.90")).toBe(1990);
    expect(toMinor("19.905")).toBe(1991);
    expect(fromMinor(1990).toFixed(2)).toBe("19.90");
  });

  it("yüzde ölçeği baz 10_000 kullanır", () => {
    expect(toPercentUnits(1)).toBe(100);
    expect(toPercentUnits("10.5")).toBe(1050);
    expect(fromPercentUnits(100).toFixed(2)).toBe("1.00");
  });

  it("desi milli dönüşümü yapar", () => {
    expect(toDesiMilli("1.5")).toBe(1500);
    expect(fromDesiMilli(1500).toFixed(1)).toBe("1.5");
  });
});
