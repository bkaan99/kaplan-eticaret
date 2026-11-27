import { describe, expect, it } from "vitest";
import { scaleToMaxEdge } from "./optimize-image";

describe("scaleToMaxEdge", () => {
  it("küçük görselleri büyütmez", () => {
    expect(scaleToMaxEdge(800, 600, 1600)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("uzun kenarı limite çeker", () => {
    expect(scaleToMaxEdge(4000, 3000, 1600)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("dikey görsellerde yüksekliği limite çeker", () => {
    expect(scaleToMaxEdge(1200, 4800, 1600)).toEqual({
      width: 400,
      height: 1600,
    });
  });
});
