import { describe, expect, it } from "vitest";
import { productBadges } from "./product-badges";

const attr = (attributeSlug: string, valueSlug: string, value: string) => ({
  attributeSlug,
  valueSlug,
  value,
});

describe("productBadges", () => {
  it("yapım niteliğini ve yalnızca 'Acılı' değerini rozet yapar", () => {
    expect(
      productBadges([
        attr("acilik", "acili", "Acılı"),
        attr("yapim", "dogal-fermente", "Doğal fermente"),
      ]),
    ).toEqual(["Doğal fermente", "Acılı"]);
  });

  it("acısız ve orta acı değerlerini göstermez", () => {
    expect(
      productBadges([
        attr("acilik", "acisiz", "Acısız"),
        attr("acilik", "orta-aci", "Orta acı"),
      ]),
    ).toEqual([]);
  });

  it("kurala girmeyen nitelikleri yok sayar ve en fazla 2 rozet döner", () => {
    expect(
      productBadges([
        attr("renk", "yesil", "Yeşil"),
        attr("yapim", "dogal-fermente", "Doğal fermente"),
        attr("yapim", "sirkeli", "Sirkeli"),
        attr("acilik", "acili", "Acılı"),
      ]),
    ).toEqual(["Doğal fermente", "Sirkeli"]);
  });
});
