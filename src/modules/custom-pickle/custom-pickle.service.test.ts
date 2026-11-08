import Decimal from "decimal.js";
import { CustomPickleAdminService } from "./custom-pickle-admin.service";
import { describe, expect, it } from "vitest";
import { ConflictError } from "@/shared/errors";
import { RetailPriceResolver } from "../catalog/pricing";
import type {
  BuilderProductRecord,
  CustomPickleRepository,
  IngredientRecord,
} from "./custom-pickle.repository";
import {
  CustomPickleService,
  customizationKey,
  ingredientExtra,
  readStoredCustomization,
} from "./custom-pickle.service";
import {
  bidonWeightGram,
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  formatSeasonRange,
  isMonthInSeason,
  isStockAvailable,
  isStockCritical,
  maxIngredientsForSize,
  type CustomPickleConfig,
  type StoredCustomization,
} from "./custom-pickle.types";

function ingredient(
  id: string,
  overrides: Partial<IngredientRecord> = {},
): IngredientRecord {
  return {
    id,
    name: id,
    slug: id,
    group: "VEGETABLE",
    description: null,
    imageUrl: null,
    pricePerKg: new Decimal("4"),
    stockKg: null,
    minStockKg: null,
    seasonStartMonth: null,
    seasonEndMonth: null,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

const PRODUCT: BuilderProductRecord = {
  id: "p1",
  name: "Kendi Turşunu Yap",
  description: null,
  status: "ACTIVE",
  trackInventory: true,
  imageUrl: null,
  variants: [
    {
      id: "v5",
      label: "5 kg bidon",
      price: new Decimal("379.90"),
      compareAtPrice: null,
      currency: "TRY",
      weightGram: null,
      isActive: true,
      stockQuantity: 10,
      reservedQuantity: 0,
    },
  ],
};

class FakeRepository implements CustomPickleRepository {
  constructor(
    public ingredients: IngredientRecord[],
    public product: BuilderProductRecord | null = PRODUCT,
  ) {}
  async listIngredients(options: { activeOnly: boolean }) {
    return this.ingredients.filter(
      (item) => !options.activeOnly || item.isActive,
    );
  }
  async findIngredients(ids: string[]) {
    return this.ingredients.filter((item) => ids.includes(item.id));
  }
  async findIngredientBySlug(slug: string) {
    return this.ingredients.find((item) => item.slug === slug) ?? null;
  }
  async createIngredient() {
    return "new";
  }
  async updateIngredient() {}
  async deleteIngredient() {}
  async findBuilderProduct() {
    return this.product;
  }
  private pickleOptions: CustomPickleConfig = {
    brines: DEFAULT_BRINE_CONFIG,
    spices: DEFAULT_SPICE_CONFIG,
  };
  async getPickleOptions() {
    return this.pickleOptions;
  }
  async savePickleOptions(config: CustomPickleConfig) {
    this.pickleOptions = config;
  }
}

function service(repository: FakeRepository) {
  return new CustomPickleService(repository, new RetailPriceResolver());
}

const VALID_INPUT = {
  variantId: "v5",
  ingredientIds: ["salatalik", "sarimsak"],
  brine: "VINEGAR",
  spice: "MEDIUM",
  note: "",
  quantity: 1,
};

describe("bidonWeightGram", () => {
  it("varyant ağırlığını, yoksa boyut adındaki kiloyu kullanır", () => {
    expect(bidonWeightGram(3000, "5 kg bidon")).toBe(3000);
    expect(bidonWeightGram(null, "5 kg bidon")).toBe(5000);
    expect(bidonWeightGram(null, "2,5 kg")).toBe(2500);
    expect(bidonWeightGram(null, "750 g kavanoz")).toBe(750);
    expect(bidonWeightGram(null, "3 L")).toBe(3000);
    expect(bidonWeightGram(null, "Büyük bidon")).toBeNull();
  });
});

describe("maxIngredientsForSize", () => {
  it("3/5/10 kg bidonlara göre 4/6/8 çeşit limiti döner", () => {
    expect(maxIngredientsForSize(3000)).toBe(4);
    expect(maxIngredientsForSize(5000)).toBe(6);
    expect(maxIngredientsForSize(10000)).toBe(8);
    expect(maxIngredientsForSize(null)).toBe(4);
  });
});

describe("ingredientExtra", () => {
  it("kg başı ücreti bidon kilosuyla çarpar, ağırlık yoksa 1 kg sayar", () => {
    expect(ingredientExtra("4", 5000).toFixed(2)).toBe("20.00");
    expect(ingredientExtra("2.5", 3000).toFixed(2)).toBe("7.50");
    expect(ingredientExtra("4", null).toFixed(2)).toBe("4.00");
  });
});

describe("customizationKey", () => {
  const base: StoredCustomization = {
    kind: "custom-pickle",
    ingredientIds: ["a", "b"],
    brine: "VINEGAR",
    spice: "MILD",
    note: null,
  };

  it("malzeme sırasından bağımsızdır, seçenek değişince değişir", () => {
    expect(customizationKey(base)).toBe(
      customizationKey({ ...base, ingredientIds: ["b", "a"] }),
    );
    expect(customizationKey(base)).not.toBe(
      customizationKey({ ...base, spice: "HOT" }),
    );
    expect(customizationKey(base)).not.toBe(
      customizationKey({ ...base, note: "bol sarımsak" }),
    );
  });

  it("bozuk sepet verisini reddeder", () => {
    expect(readStoredCustomization(null)).toBeNull();
    expect(readStoredCustomization({ kind: "other" })).toBeNull();
    expect(readStoredCustomization({ ...base, brine: "UNKNOWN" })).toBeNull();
    expect(readStoredCustomization(base)).toEqual(base);
  });
});

describe("CustomPickleService.prepare", () => {
  const ingredients = [
    ingredient("salatalik"),
    ingredient("sarimsak", { group: "AROMA" }),
    ingredient("dereotu", { group: "AROMA" }),
    ingredient("eski", { isActive: false }),
  ];

  it("geçerli seçimi sıralı malzemeler ve anahtarla döndürür", async () => {
    const prepared = await service(new FakeRepository(ingredients)).prepare({
      ...VALID_INPUT,
      ingredientIds: ["sarimsak", "salatalik", "sarimsak"],
      note: "  ince doğransın  ",
    });

    expect(prepared.variantId).toBe("v5");
    expect(prepared.customization.ingredientIds).toEqual([
      "salatalik",
      "sarimsak",
    ]);
    expect(prepared.customization.note).toBe("ince doğransın");
    expect(prepared.key).toHaveLength(24);
  });

  it("oran gönderilmezse sebzeleri eşit dağıtır, aromaya oran vermez", async () => {
    const prepared = await service(new FakeRepository(ingredients)).prepare({
      ...VALID_INPUT,
      ingredientIds: ["salatalik", "sarimsak"],
    });
    expect(prepared.customization.shares).toEqual({ salatalik: 100 });
  });

  it("bidonu tam doldurmayan oranı reddeder", async () => {
    await expect(
      service(new FakeRepository(ingredients)).prepare({
        ...VALID_INPUT,
        ingredientIds: ["salatalik"],
        shares: { salatalik: 80 },
      }),
    ).rejects.toThrow(/toplam %100/);
  });

  it("en az bir sebze ister", async () => {
    await expect(
      service(new FakeRepository(ingredients)).prepare({
        ...VALID_INPUT,
        ingredientIds: ["sarimsak", "dereotu"],
      }),
    ).rejects.toThrow(/en az bir sebze/);
  });

  it("pasif veya bilinmeyen malzemeyi kabul etmez", async () => {
    await expect(
      service(new FakeRepository(ingredients)).prepare({
        ...VALID_INPUT,
        ingredientIds: ["salatalik", "eski"],
      }),
    ).rejects.toThrow(/artık mevcut değil/);
  });

  it("başka ürünün varyantını ve sınır aşımını reddeder", async () => {
    const pickle = service(new FakeRepository(ingredients));
    await expect(
      pickle.prepare({ ...VALID_INPUT, variantId: "baska" }),
    ).rejects.toThrow();
    await expect(
      pickle.prepare({
        ...VALID_INPUT,
        ingredientIds: Array.from({ length: 9 }, (_, i) => `m${i}`),
      }),
    ).rejects.toThrow(/En fazla 8/);
  });

  it("bidon boyutuna göre çeşit üst sınırını uygular", async () => {
    const threeKg: BuilderProductRecord = {
      ...PRODUCT,
      variants: [
        {
          ...PRODUCT.variants[0]!,
          id: "v3",
          label: "3 kg bidon",
          weightGram: 3000,
        },
      ],
    };
    const pickle = service(new FakeRepository(ingredients, threeKg));
    await expect(
      pickle.prepare({
        ...VALID_INPUT,
        variantId: "v3",
        ingredientIds: Array.from({ length: 5 }, (_, i) => `m${i}`),
      }),
    ).rejects.toThrow(/en fazla 4 malzeme/i);

    // 5 kg (etiketten) → en fazla 6
    const fiveKgPickle = service(new FakeRepository(ingredients));
    await expect(
      fiveKgPickle.prepare({
        ...VALID_INPUT,
        ingredientIds: Array.from({ length: 7 }, (_, i) => `m${i}`),
      }),
    ).rejects.toThrow(/en fazla 6 malzeme/i);
  });
});

describe("ingredientExtra (oranlı)", () => {
  it("malzeme ücretini bidondaki payı kadar hesaplar", () => {
    expect(ingredientExtra("10", 5000, 30).toFixed(2)).toBe("15.00");
    expect(ingredientExtra("10", 5000).toFixed(2)).toBe("50.00");
  });
});

describe("customizationKey (oranlı)", () => {
  const base: StoredCustomization = {
    kind: "custom-pickle",
    ingredientIds: ["a", "b"],
    brine: "VINEGAR",
    spice: "MILD",
    note: null,
  };

  it("oran değişince anahtar değişir, oran sırası etkilemez", () => {
    const first = customizationKey({ ...base, shares: { a: 60, b: 40 } });
    expect(customizationKey({ ...base, shares: { b: 40, a: 60 } })).toBe(first);
    expect(customizationKey({ ...base, shares: { a: 50, b: 50 } })).not.toBe(
      first,
    );
  });

  it("oransız eski satırların anahtarı oranlıdan farklı kalır", () => {
    expect(customizationKey(base)).not.toBe(
      customizationKey({ ...base, shares: { a: 50, b: 50 } }),
    );
  });
});

describe("CustomPickleService.quote", () => {
  it("güncel fiyatlarla ek ücret, özet ve sipariş kopyası üretir", async () => {
    const repository = new FakeRepository([
      ingredient("salatalik", {
        name: "Salatalık",
        pricePerKg: new Decimal("5"),
      }),
      ingredient("sarimsak", {
        name: "Sarımsak",
        group: "AROMA",
        pricePerKg: new Decimal("3"),
        sortOrder: 1,
      }),
    ]);

    const [quote] = await service(repository).quote([
      {
        customization: {
          kind: "custom-pickle",
          ingredientIds: ["salatalik", "sarimsak"],
          brine: "NATURAL",
          spice: "HOT",
          note: "Bol olsun",
        },
        weightGram: 5000,
      },
    ]);

    expect(quote!.available).toBe(true);
    expect(quote!.extra.toFixed(2)).toBe("40.00");
    expect(quote!.summary).toBe(
      "Salatalık, Sarımsak · Doğal fermente · Acılı · Not: Bol olsun",
    );
    expect(quote!.snapshot.ingredients).toEqual([
      { id: "salatalik", name: "Salatalık", unitExtra: "25.00" },
      { id: "sarimsak", name: "Sarımsak", unitExtra: "15.00" },
    ]);
  });

  it("satıştan kalkan malzemede satırı satın alınamaz işaretler", async () => {
    const repository = new FakeRepository([
      ingredient("salatalik", { isActive: false }),
    ]);
    const [quote] = await service(repository).quote([
      {
        customization: {
          kind: "custom-pickle",
          ingredientIds: ["salatalik", "silinmis"],
          brine: "VINEGAR",
          spice: "MILD",
          note: null,
        },
        weightGram: 3000,
      },
    ]);
    expect(quote!.available).toBe(false);
  });

  it("dinamik salamura ve acılık seçeneklerini kaydeder, quote ve builder'da yansıtır", async () => {
    const repository = new FakeRepository([
      ingredient("salatalik", {
        name: "Salatalık",
        pricePerKg: new Decimal("5"),
      }),
    ]);
    const s = service(repository);
    const admin = new CustomPickleAdminService(repository);

    // Yeni salamura (Elma Sirkeli) ve yeni acılık (Atom) ekle
    await admin.saveOptions(
      {
        brines: [
          {
            key: "APPLE_CIDER",
            label: "Elma Sirkeli",
            description: "Meyvemsi lezzet",
            color: "#fef08a",
            hasBubbles: false,
            isActive: true,
            sortOrder: 0,
          },
        ],
        spices: [
          {
            key: "EXTRA_HOT",
            label: "Çok Acılı (Atom)",
            description: "Ekstra Arnavut biberli",
            peppers: 5,
            tint: 0.6,
            isActive: true,
            sortOrder: 0,
          },
        ],
      },
      { userId: "admin-1", ip: "127.0.0.1" },
    );

    // Builder verisinde dinamik seçenekler gelmeli
    const builder = await s.getBuilder({ customerGroupId: null });
    expect(builder?.brines[0]?.label).toBe("Elma Sirkeli");
    expect(builder?.spices[0]?.label).toBe("Çok Acılı (Atom)");

    // Yeni seçeneklerle prepare başarılı olmalı
    const prepared = await s.prepare({
      variantId: "v5",
      ingredientIds: ["salatalik"],
      brine: "APPLE_CIDER",
      spice: "EXTRA_HOT",
      note: null,
    });
    expect(prepared.customization.brine).toBe("APPLE_CIDER");

    // Quote özetinde dinamik başlıklar kullanılmalı
    const [quote] = await s.quote([
      {
        customization: prepared.customization,
        weightGram: 5000,
      },
    ]);
    expect(quote!.summary).toBe(
      "Salatalık %100 · Elma Sirkeli · Çok Acılı (Atom)",
    );
    expect(quote!.snapshot.brine).toBe("Elma Sirkeli");
    expect(quote!.snapshot.spice).toBe("Çok Acılı (Atom)");
  });

  it("stok ve mevsimsellik yardımcı fonksiyonları doğru çalışır", () => {
    // Limitsiz veya pozitif stok
    expect(isStockAvailable(null)).toBe(true);
    expect(isStockAvailable(undefined)).toBe(true);
    expect(isStockAvailable(new Decimal("10"))).toBe(true);
    expect(isStockAvailable(new Decimal("0"))).toBe(false);
    expect(isStockAvailable(new Decimal("-1"))).toBe(false);

    // Kritik stok
    expect(isStockCritical(new Decimal("5"), new Decimal("10"))).toBe(true);
    expect(isStockCritical(new Decimal("10"), new Decimal("10"))).toBe(true);
    expect(isStockCritical(new Decimal("15"), new Decimal("10"))).toBe(false);
    expect(isStockCritical(null, new Decimal("10"))).toBe(false);
    expect(isStockCritical(new Decimal("5"), null)).toBe(false);

    // Mevsimsellik (tek yıl)
    expect(isMonthInSeason(6, 9, 7)).toBe(true);
    expect(isMonthInSeason(6, 9, 5)).toBe(false);
    expect(isMonthInSeason(6, 9, 10)).toBe(false);

    // Mevsimsellik (yıl aşan kış sebzesi, örn. Kasım - Şubat: 11 - 2)
    expect(isMonthInSeason(11, 2, 12)).toBe(true);
    expect(isMonthInSeason(11, 2, 1)).toBe(true);
    expect(isMonthInSeason(11, 2, 5)).toBe(false);

    // Tüm yıl
    expect(isMonthInSeason(null, null, 5)).toBe(true);

    // Format
    expect(formatSeasonRange(null, null)).toBe("Tüm Yıl");
    expect(formatSeasonRange(6, 9)).toBe("Haziran - Eylül");
  });

  it("tükenen malzeme prepare'de ConflictError fırlatır ve quote'da available: false olur", async () => {
    const repository = new FakeRepository([
      ingredient("salatalik", {
        name: "Salatalık",
        stockKg: new Decimal("0"), // Tükendi
      }),
    ]);
    const s = service(repository);

    // prepare ConflictError fırlatmalı
    await expect(
      s.prepare({
        variantId: "v5",
        ingredientIds: ["salatalik"],
        brine: "VINEGAR",
        spice: "MILD",
        note: null,
      }),
    ).rejects.toThrow(ConflictError);

    // quote'da available: false olmalı
    const [quote] = await s.quote([
      {
        customization: {
          kind: "custom-pickle",
          ingredientIds: ["salatalik"],
          brine: "VINEGAR",
          spice: "MILD",
          note: null,
        },
        weightGram: 5000,
      },
    ]);
    expect(quote!.available).toBe(false);
  });

  it("mevsim dışı malzeme prepare'de ConflictError fırlatır ve quote'da available: false olur", async () => {
    const currentMonth = new Date().getMonth() + 1;
    // Mevcut aydan farklı bir aralık belirleyelim
    const outStart = currentMonth === 1 ? 2 : 1;
    const outEnd = currentMonth === 1 ? 2 : 1;

    const repository = new FakeRepository([
      ingredient("karnabahar", {
        name: "Karnabahar",
        seasonStartMonth: outStart,
        seasonEndMonth: outEnd,
      }),
    ]);
    const s = service(repository);

    // prepare ConflictError fırlatmalı
    await expect(
      s.prepare({
        variantId: "v5",
        ingredientIds: ["karnabahar"],
        brine: "VINEGAR",
        spice: "MILD",
        note: null,
      }),
    ).rejects.toThrow(ConflictError);

    // quote'da available: false olmalı
    const [quote] = await s.quote([
      {
        customization: {
          kind: "custom-pickle",
          ingredientIds: ["karnabahar"],
          brine: "VINEGAR",
          spice: "MILD",
          note: null,
        },
        weightGram: 5000,
      },
    ]);
    expect(quote!.available).toBe(false);
  });

  it("builder listesinde malzeme stok ve mevsim bilgileri view modeline aktarılır", async () => {
    const repository = new FakeRepository([
      ingredient("salatalik", {
        name: "Salatalık",
        stockKg: new Decimal("50"),
        minStockKg: new Decimal("10"),
        seasonStartMonth: 6,
        seasonEndMonth: 9,
      }),
      ingredient("tukenen", {
        name: "Tükenen Sebze",
        stockKg: new Decimal("0"),
      }),
    ]);
    const s = service(repository);

    const builder = await s.getBuilder({ customerGroupId: null });
    expect(builder).not.toBeNull();

    const salatalik = builder!.ingredients.find((i) => i.id === "salatalik");
    expect(salatalik).toBeDefined();
    expect(salatalik!.stockKg).toBe("50.00");
    expect(salatalik!.minStockKg).toBe("10.00");
    expect(salatalik!.inStock).toBe(true);

    const tukenen = builder!.ingredients.find((i) => i.id === "tukenen");
    expect(tukenen).toBeDefined();
    expect(tukenen!.inStock).toBe(false);
    expect(tukenen!.isAvailable).toBe(false);
  });
});
