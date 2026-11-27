import { describe, expect, it } from "vitest";
import { requiredBrine, resolveBrine } from "./custom-pickle.brine";
import {
  DEFAULT_BRINE_CONFIG,
  type PickleBrineOption,
} from "./custom-pickle.types";

const brines = DEFAULT_BRINE_CONFIG;
const option = (key: string) => brines.find((item) => item.key === key)!;

describe("requiredBrine", () => {
  it("atanmış malzeme yoksa null döner", () => {
    expect(
      requiredBrine([{ brineKey: null }, { brineKey: null }], brines),
    ).toBeNull();
  });

  it("kırmızı suyu beyaza tercih eder", () => {
    const result = requiredBrine(
      [{ brineKey: "WHITE" }, { brineKey: "RED" }],
      brines,
    );
    expect(result?.key).toBe("RED");
  });

  it("tanımsız veya pasif seçeneği yok sayar", () => {
    const withInactive: PickleBrineOption[] = brines.map((item) =>
      item.key === "RED" ? { ...item, isActive: false } : item,
    );
    expect(
      requiredBrine(
        [{ brineKey: "RED" }, { brineKey: "SILINMIS" }],
        withInactive,
      ),
    ).toBeNull();
  });
});

describe("resolveBrine", () => {
  it("renk veren malzeme seçilince salamurayı yükseltir", () => {
    const result = resolveBrine({
      current: "WHITE",
      auto: null,
      required: option("RED"),
      brines,
    });
    expect(result.brine).toBe("RED");
    expect(result.auto).toEqual({ key: "RED", previous: "WHITE" });
    expect(result.raised?.key).toBe("RED");
  });

  it("müşteri zaten kırmızı seçtiyse dokunmaz", () => {
    const result = resolveBrine({
      current: "RED",
      auto: null,
      required: option("RED"),
      brines,
    });
    expect(result).toEqual({ brine: "RED", auto: null, raised: null });
  });

  it("renk veren malzeme çıkınca önceki seçime döner", () => {
    const result = resolveBrine({
      current: "RED",
      auto: { key: "RED", previous: "WHITE" },
      required: null,
      brines,
    });
    expect(result.brine).toBe("WHITE");
    expect(result.auto).toBeNull();
  });

  it("müşteri elle değiştirdiyse geri almaz", () => {
    const result = resolveBrine({
      current: "WHITE",
      auto: { key: "RED", previous: "WHITE" },
      required: null,
      brines,
    });
    expect(result.brine).toBe("WHITE");
    expect(result.auto).toBeNull();
  });
});
