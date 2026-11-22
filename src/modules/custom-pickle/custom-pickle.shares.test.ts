import { describe, expect, it } from "vitest";
import {
  addShare,
  decreaseShare,
  entryRangeGrams,
  equalShares,
  increaseShare,
  removeShare,
  shareToGrams,
  sharesAreValid,
  stepGrams,
  totalShare,
} from "./custom-pickle.shares";

describe("bidon oranları", () => {
  it("eşit dağıtır, artanı ilk sebzelere verir ve toplam 100 olur", () => {
    expect(equalShares(["a", "b", "c"])).toEqual({ a: 35, b: 35, c: 30 });
    expect(totalShare(equalShares(["a", "b", "c", "d", "e", "f", "g"]))).toBe(
      100,
    );
    expect(equalShares(["a", "b", "c", "d", "e", "f", "g", "h"])).toMatchObject(
      { a: 15, h: 10 },
    );
    expect(equalShares([])).toEqual({});
  });

  it("doluyken en büyük paydan alır, boş yer varsa oradan doldurur", () => {
    expect(increaseShare({ a: 60, b: 20, c: 20 }, "b")).toEqual({
      a: 55,
      b: 25,
      c: 20,
    });
    expect(increaseShare({ a: 50, b: 20 }, "b")).toEqual({ a: 50, b: 25 });
    expect(increaseShare({ a: 95, b: 5 }, "a")).toEqual({ a: 95, b: 5 });
  });

  it("en az bir adımın altına inmez", () => {
    expect(decreaseShare({ a: 20, b: 80 }, "a")).toEqual({ a: 15, b: 80 });
    expect(decreaseShare({ a: 5, b: 95 }, "a")).toEqual({ a: 5, b: 95 });
  });

  it("geçersiz oranları reddeder", () => {
    expect(sharesAreValid({ a: 50, b: 50 }, ["a", "b"])).toBe(true);
    expect(sharesAreValid({ a: 55, b: 45 }, ["a", "b"])).toBe(true);
    expect(sharesAreValid({ a: 50, b: 40 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 52, b: 48 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100, b: 0 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100, x: 0 }, ["a"])).toBe(false);
  });
});

describe("gram karşılıkları", () => {
  it("bir dokunuş bidon boyuna göre 150 g / 250 g / 500 g eder", () => {
    expect(stepGrams(3000)).toBe(150);
    expect(stepGrams(5000)).toBe(250);
    expect(stepGrams(10000)).toBe(500);
  });

  it("oranı grama çevirir; ağırlık yoksa 1 kg sayar", () => {
    expect(shareToGrams(30, 3000)).toBe(900);
    expect(shareToGrams(50, null)).toBe(500);
  });

  it("yeni çeşit 2-3 adım aralığında girer (3 kg'da 300-450 g)", () => {
    expect(entryRangeGrams(3000)).toEqual({ min: 300, max: 450 });
  });
});

describe("çeşit ekleme ve çıkarma (elle ayarlar korunur)", () => {
  it("ilk sebze bidonun tamamını alır", () => {
    expect(addShare({}, "a")).toEqual({ a: 100 });
  });

  it("yeni sebze 3 adımla girer ve en büyük paydan alır", () => {
    const next = addShare({ a: 100 }, "b");
    expect(next).toEqual({ a: 85, b: 15 });
    expect(totalShare(next)).toBe(100);
  });

  it("boş yer varsa önce oradan alır, mevcut oranlara dokunmaz", () => {
    expect(addShare({ a: 40, b: 40 }, "c")).toEqual({ a: 40, b: 40, c: 15 });
  });

  it("toplam her zaman 100 kalır ve hiçbir pay bir adımın altına inmez", () => {
    let shares = addShare({}, "a");
    for (const id of ["b", "c", "d", "e", "f", "g", "h"]) {
      shares = addShare(shares, id);
      expect(totalShare(shares)).toBe(100);
      expect(Math.min(...Object.values(shares))).toBeGreaterThanOrEqual(5);
    }
  });

  it("zaten bidondaki sebzeyi tekrar eklemez", () => {
    const shares = { a: 60, b: 40 };
    expect(addShare(shares, "a")).toBe(shares);
  });

  it("çıkarılan payı kalanlara en büyükten başlayarak dağıtır", () => {
    const next = removeShare({ a: 50, b: 30, c: 20 }, "b");
    expect(totalShare(next)).toBe(100);
    expect(next).toEqual({ a: 65, c: 35 });
    expect(next).not.toHaveProperty("b");
  });

  it("son sebze çıkarılınca boş döner", () => {
    expect(removeShare({ a: 100 }, "a")).toEqual({});
  });
});
