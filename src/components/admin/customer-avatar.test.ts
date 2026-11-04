import { describe, expect, it } from "vitest";
import { initials } from "./customer-avatar";

describe("initials", () => {
  it("ad ve soyadın ilk harflerini Türkçe büyük harfle verir", () => {
    expect(initials("ilkay şahin")).toBe("İŞ");
    expect(initials("Ayşe Nur Kaya")).toBe("AK");
  });

  it("tek kelimede tek harf, boşta soru işareti döner", () => {
    expect(initials("mehmet")).toBe("M");
    expect(initials("  ")).toBe("?");
  });
});
