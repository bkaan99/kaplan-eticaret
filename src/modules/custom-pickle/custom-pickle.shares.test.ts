import { describe, expect, it } from "vitest";
import {
  decreaseShare,
  equalShares,
  increaseShare,
  sharesAreValid,
  totalShare,
} from "./custom-pickle.shares";

describe("bidon oranları", () => {
  it("eşit dağıtır, artanı ilk sebzelere verir ve toplam 100 olur", () => {
    expect(equalShares(["a", "b", "c"])).toEqual({ a: 40, b: 30, c: 30 });
    expect(totalShare(equalShares(["a", "b", "c", "d", "e", "f", "g"]))).toBe(
      100,
    );
    expect(equalShares([])).toEqual({});
  });

  it("doluyken en büyük paydan alır, boş yer varsa oradan doldurur", () => {
    expect(increaseShare({ a: 60, b: 20, c: 20 }, "b")).toEqual({
      a: 50,
      b: 30,
      c: 20,
    });
    expect(increaseShare({ a: 50, b: 20 }, "b")).toEqual({ a: 50, b: 30 });
    expect(increaseShare({ a: 90, b: 10 }, "a")).toEqual({ a: 90, b: 10 });
  });

  it("en az bir adımın altına inmez", () => {
    expect(decreaseShare({ a: 20, b: 80 }, "a")).toEqual({ a: 10, b: 80 });
    expect(decreaseShare({ a: 10, b: 90 }, "a")).toEqual({ a: 10, b: 90 });
  });

  it("geçersiz oranları reddeder", () => {
    expect(sharesAreValid({ a: 50, b: 50 }, ["a", "b"])).toBe(true);
    expect(sharesAreValid({ a: 50, b: 40 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 55, b: 45 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100, b: 0 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100 }, ["a", "b"])).toBe(false);
    expect(sharesAreValid({ a: 100, x: 0 }, ["a"])).toBe(false);
  });
});
