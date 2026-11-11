import { describe, expect, it } from "vitest";
import {
  normalizeTurkishMobile,
  sanitizeTurkishMobileInput,
} from "./tr-mobile";

describe("sanitizeTurkishMobileInput", () => {
  it.each([
    ["05ab55-123-45-678999", "05551234567"],
    ["+90 555 123 45 67", "905551234567"],
    ["555123456789", "5551234567"],
    ["abc", ""],
  ])("%s → %s", (input, expected) => {
    expect(sanitizeTurkishMobileInput(input)).toBe(expected);
  });
});

describe("normalizeTurkishMobile", () => {
  it.each([
    ["0555 123 45 67", "05551234567"],
    ["+90 555 123 45 67", "05551234567"],
    ["5551234567", "05551234567"],
    ["(0555) 123-45-67", "05551234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeTurkishMobile(input)).toBe(expected);
  });

  it("geçersiz numarada null döner", () => {
    expect(normalizeTurkishMobile("0212 123 45 67")).toBeNull();
    expect(normalizeTurkishMobile("123")).toBeNull();
  });
});
