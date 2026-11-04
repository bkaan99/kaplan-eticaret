import { describe, expect, it } from "vitest";
import { axisLabel, niceMax } from "./revenue-chart";

describe("niceMax", () => {
  it.each([
    [0, 1000],
    [830, 1000],
    [1200, 1500],
    [2796, 3000],
    [4100, 5000],
    [12_000, 15_000],
  ])("%d → %d", (input, expected) => {
    expect(niceMax(input)).toBe(expected);
  });
});

describe("axisLabel", () => {
  it("binleri ve milyonları açıkça yazar", () => {
    expect(axisLabel(0)).toBe("0");
    expect(axisLabel(800)).toBe("₺800");
    expect(axisLabel(1500)).toBe("₺1,5 bin");
    expect(axisLabel(2_000_000)).toBe("₺2 mn");
  });
});
