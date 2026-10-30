import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
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

    // Yeni salamura (Elma Sirkeli) ve yeni acılık (Atom) ekle
    await s.saveOptions(
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
    expect(quote!.summary).toBe("Salatalık · Elma Sirkeli · Çok Acılı (Atom)");
    expect(quote!.snapshot.brine).toBe("Elma Sirkeli");
    expect(quote!.snapshot.spice).toBe("Çok Acılı (Atom)");
  });
});
