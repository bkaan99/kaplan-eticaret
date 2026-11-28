import { describe, expect, it } from "vitest";
import {
  activeCount,
  addRow,
  axisOf,
  baseSkuFrom,
  canDisableAxis,
  disableAxis,
  enableAxis,
  optionsFromRows,
  removeRow,
  renameAxis,
  setRowValue,
  skuForValue,
  validateRows,
  type VariantRow,
  type VariantState,
} from "./variant-rows";

const BASE = "TURSU";

const single = (): VariantState => ({
  options: [],
  variants: [
    {
      id: "v1",
      sku: "TURSU",
      barcode: "",
      price: "249.90",
      compareAtPrice: "",
      stockQuantity: "7",
      isActive: true,
      optionValues: {},
    },
  ],
});

const sized = (): VariantState => ({
  options: [{ name: "Boyut", values: "3 kg, 5 kg" }],
  variants: [
    {
      id: "a",
      sku: "TURSU-3KG",
      barcode: "",
      price: "249.90",
      compareAtPrice: "299.90",
      stockQuantity: "10",
      isActive: true,
      optionValues: { Boyut: "3 kg" },
    },
    {
      id: "b",
      sku: "TURSU-5KG",
      barcode: "",
      price: "379.90",
      compareAtPrice: "",
      stockQuantity: "4",
      isActive: true,
      optionValues: { Boyut: "5 kg" },
    },
  ],
});

describe("SKU üretimi", () => {
  it("ürün adından ön ek ve değerden sonek üretir", () => {
    expect(baseSkuFrom("", "Ev Usulü Turşu")).toBe("EV-USUL-TUR-U");
    expect(skuForValue("TURSU", "3 kg")).toBe("TURSU-3KG");
    expect(skuForValue("TURSU", "")).toBe("TURSU");
  });
});

describe("tek fiyattan boyutlara geçiş", () => {
  it("mevcut varyant ilk satır olur, fiyatını ve kimliğini korur, ikinci boş satır gelir", () => {
    const next = enableAxis(single(), BASE);
    expect(axisOf(next.options)).toBe("Boyut");
    expect(next.variants).toHaveLength(2);
    expect(next.variants[0]).toMatchObject({ id: "v1", price: "249.90" });
    expect(next.variants[0]!.optionValues).toEqual({ Boyut: "" });
    expect(next.variants[1]).toMatchObject({ price: "" });
    expect(next.variants[1]!.id).toBeUndefined();
  });
});

describe("satır ekleme ve değer yazma", () => {
  it("yeni satır boş fiyatla gelir (3 kg fiyatı sessizce kopyalanmaz)", () => {
    const next = addRow(sized(), BASE, "10 kg");
    const row = next.variants[2]!;
    expect(row).toMatchObject({
      price: "",
      stockQuantity: "0",
      sku: "TURSU-10KG",
    });
    expect(next.options[0]!.values).toBe("3 kg, 5 kg, 10 kg");
  });

  it("aynı değer ikinci kez eklenmez (büyük/küçük harf duyarsız)", () => {
    const state = sized();
    expect(addRow(state, BASE, "3 KG")).toBe(state);
  });

  it("yeni satırda değer yazınca SKU güncellenir; kayıtlı satırın SKU'su değişmez", () => {
    let state = addRow(sized(), BASE);
    state = setRowValue(state, BASE, 2, "10 kg");
    expect(state.variants[2]!.sku).toBe("TURSU-10KG");
    state = setRowValue(state, BASE, 0, "3 kg bidon");
    expect(state.variants[0]!.sku).toBe("TURSU-3KG");
    expect(state.variants[0]!.optionValues).toEqual({ Boyut: "3 kg bidon" });
    expect(state.options[0]!.values).toBe("3 kg bidon, 5 kg, 10 kg");
  });

  it("elle değiştirilmiş SKU korunur", () => {
    let state = addRow(sized(), BASE, "10 kg");
    state = {
      ...state,
      variants: state.variants.map((row, i) =>
        i === 2 ? { ...row, sku: "OZEL-KOD" } : row,
      ),
    };
    state = setRowValue(state, BASE, 2, "15 kg");
    expect(state.variants[2]!.sku).toBe("OZEL-KOD");
  });
});

describe("eksen adı", () => {
  it("adı değişince tüm satırlar yeni adla yeniden anahtarlanır", () => {
    const next = renameAxis(sized(), "Ağırlık");
    expect(next.options).toEqual([{ name: "Ağırlık", values: "3 kg, 5 kg" }]);
    expect(next.variants.map((v) => v.optionValues)).toEqual([
      { Ağırlık: "3 kg" },
      { Ağırlık: "5 kg" },
    ]);
  });
});

describe("satır kaldırma", () => {
  it("kayıtlı varyant silinmez, satıştan kaldırılır (pasifleşir)", () => {
    const next = removeRow(sized(), 1);
    expect(next.variants).toHaveLength(2);
    expect(next.variants[1]).toMatchObject({ id: "b", isActive: false });
    expect(activeCount(next.variants)).toBe(1);
    // Pasif satırın değeri de listede kalır; kayıtta şema bunu bekler.
    expect(next.options[0]!.values).toBe("3 kg, 5 kg");
  });

  it("kaydedilmemiş satır tamamen çıkarılır", () => {
    const withNew = addRow(sized(), BASE, "10 kg");
    const next = removeRow(withNew, 2);
    expect(next.variants).toHaveLength(2);
    expect(next.options[0]!.values).toBe("3 kg, 5 kg");
  });
});

describe("tek fiyata dönüş", () => {
  it("yalnızca tek satır varken eksen kaldırılır", () => {
    expect(canDisableAxis(sized())).toBe(false);
    const one: VariantState = {
      options: [{ name: "Boyut", values: "3 kg" }],
      variants: [sized().variants[0]!],
    };
    expect(canDisableAxis(one)).toBe(true);
    const next = disableAxis(one);
    expect(next.options).toEqual([]);
    expect(next.variants[0]).toMatchObject({ id: "a", optionValues: {} });
  });
});

describe("kaydetmeden önce doğrulama", () => {
  it("geçerli tabloda sorun yoktur", () => {
    expect(validateRows(sized())).toEqual({});
  });

  it("boş ad, boş fiyat ve tekrar eden adı satır bazında bildirir", () => {
    let state = addRow(sized(), BASE);
    state = addRow(state, BASE);
    state = setRowValue(state, BASE, 3, "5 kg");
    const issues = validateRows(state);
    expect(issues[2]).toMatchObject({
      value: "Ad yazın (örn. 3 kg)",
      price: "Fiyat girin",
    });
    expect(issues[3]).toMatchObject({ value: "Bu ad zaten var" });
    expect(issues[0]).toBeUndefined();
  });

  it("virgüllü tutarı kabul eder, geçersiz eski fiyat ve stoğu reddeder", () => {
    const rows: VariantRow[] = sized().variants.map((row, i) =>
      i === 0
        ? {
            ...row,
            price: "249,90",
            compareAtPrice: "abc",
            stockQuantity: "-1",
          }
        : row,
    );
    const issues = validateRows({ ...sized(), variants: rows });
    expect(issues[0]).toMatchObject({
      compareAtPrice: "Geçerli tutar girin",
      stockQuantity: "Tam sayı girin",
    });
    expect(issues[0]!.price).toBeUndefined();
  });

  it("tek fiyatlı üründe ad aranmaz", () => {
    expect(validateRows(single())).toEqual({});
  });
});

describe("seçenek listesi satırlardan türetilir", () => {
  it("tekrarsız ve boşsuz yazar", () => {
    const rows = [
      { ...sized().variants[0]!, optionValues: { Boyut: "3 kg" } },
      { ...sized().variants[1]!, optionValues: { Boyut: "3 KG" } },
      { ...sized().variants[1]!, optionValues: { Boyut: "" } },
    ];
    expect(optionsFromRows("Boyut", rows)).toEqual([
      { name: "Boyut", values: "3 kg" },
    ]);
  });
});
