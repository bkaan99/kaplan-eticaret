import { describe, expect, it } from "vitest";
import { requiredSpice, resolveSpice } from "./custom-pickle.spice";
import {
  DEFAULT_SPICE_CONFIG,
  type PickleSpiceOption,
} from "./custom-pickle.types";

const spices = DEFAULT_SPICE_CONFIG; // MILD 0, MEDIUM 1, HOT 3, EXTRA_HOT 4
const option = (key: string) => spices.find((item) => item.key === key)!;

describe("requiredSpice", () => {
  it("acı atanmış malzeme yoksa null döner", () => {
    expect(
      requiredSpice([{ spiceKey: null }, { spiceKey: null }], spices),
    ).toBeNull();
  });

  it("birden fazla acılı malzemede en yükseğini seçer", () => {
    const result = requiredSpice(
      [{ spiceKey: "MEDIUM" }, { spiceKey: "EXTRA_HOT" }, { spiceKey: "HOT" }],
      spices,
    );
    expect(result?.key).toBe("EXTRA_HOT");
  });

  it("tanımsız veya pasif seçeneği yok sayar", () => {
    const withInactive: PickleSpiceOption[] = spices.map((item) =>
      item.key === "HOT" ? { ...item, isActive: false } : item,
    );
    expect(
      requiredSpice(
        [{ spiceKey: "HOT" }, { spiceKey: "SILINMIS" }],
        withInactive,
      ),
    ).toBeNull();
  });
});

describe("resolveSpice", () => {
  it("gereken seviye mevcuttan yüksekse yükseltir ve öncekini saklar", () => {
    const result = resolveSpice({
      current: "MEDIUM",
      auto: null,
      required: option("HOT"),
      spices,
    });
    expect(result.spice).toBe("HOT");
    expect(result.auto).toEqual({ key: "HOT", previous: "MEDIUM" });
    expect(result.raised?.key).toBe("HOT");
  });

  it("müşteri zaten daha yüksek seçtiyse dokunmaz", () => {
    const result = resolveSpice({
      current: "EXTRA_HOT",
      auto: null,
      required: option("HOT"),
      spices,
    });
    expect(result).toEqual({ spice: "EXTRA_HOT", auto: null, raised: null });
  });

  it("acılı malzeme çıkarılınca önceki seçime döner", () => {
    const result = resolveSpice({
      current: "HOT",
      auto: { key: "HOT", previous: "MEDIUM" },
      required: null,
      spices,
    });
    expect(result.spice).toBe("MEDIUM");
    expect(result.auto).toBeNull();
    expect(result.raised).toBeNull();
  });

  it("daha acılı malzeme eklenince seviyeyi yükseltir, önceki seçimi korur", () => {
    const result = resolveSpice({
      current: "HOT",
      auto: { key: "HOT", previous: "MEDIUM" },
      required: option("EXTRA_HOT"),
      spices,
    });
    expect(result.spice).toBe("EXTRA_HOT");
    expect(result.auto).toEqual({ key: "EXTRA_HOT", previous: "MEDIUM" });
  });

  it("en acı malzeme çıkınca bir alt gereken seviyeye iner", () => {
    const result = resolveSpice({
      current: "EXTRA_HOT",
      auto: { key: "EXTRA_HOT", previous: "MILD" },
      required: option("HOT"),
      spices,
    });
    expect(result.spice).toBe("HOT");
    expect(result.auto).toEqual({ key: "HOT", previous: "MILD" });
  });

  it("müşteri elle değiştirdiyse (auto temizlenmiş) geri almaz", () => {
    const result = resolveSpice({
      current: "MILD",
      auto: null,
      required: null,
      spices,
    });
    expect(result).toEqual({ spice: "MILD", auto: null, raised: null });
  });

  it("müşteri elle başka seviyeye geçtiyse otomatik kaydı bırakır", () => {
    const result = resolveSpice({
      current: "MILD",
      auto: { key: "HOT", previous: "MEDIUM" },
      required: null,
      spices,
    });
    expect(result.spice).toBe("MILD");
    expect(result.auto).toBeNull();
  });
});
