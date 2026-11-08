import {
  equalShares,
  FULL_SHARE,
  sharesAreValid,
} from "./custom-pickle.shares";
import { createHash } from "node:crypto";
import type Decimal from "decimal.js";
import type { AuditLogger } from "@/shared/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors";
import { roundMoney, toDecimal } from "@/shared/money";
import { availableQuantity } from "../catalog/availability";
import type { PriceResolver, PricingContext } from "../catalog/pricing";
import type {
  CustomPickleRepository,
  IngredientRecord,
} from "./custom-pickle.repository";
import type {
  CustomizationLineItem,
  ItemCustomizationHandler,
} from "../cart/customization";
import { customPickleInputSchema } from "./custom-pickle.schema";
import { firstIssue } from "@/shared/validation";
import { registerOptions, toView } from "./custom-pickle.support";
import {
  bidonWeightGram,
  BRINE_OPTIONS,
  CUSTOM_PICKLE_PRODUCT_SLUG,
  isMonthInSeason,
  isStockAvailable,
  maxIngredientsForSize,
  SPICE_OPTIONS,
  type CustomPickleConfig,
  type CustomizationPricer,
  type CustomizationQuote,
  type IngredientView,
  type PickleBrineOption,
  type PickleSpiceOption,
  type StoredCustomization,
} from "./custom-pickle.types";

/** Bidonun kilogramı; tanımlı değilse 1 kg sayılır. */
export function bidonKg(weightGram: number | null): Decimal {
  return weightGram && weightGram > 0
    ? toDecimal(weightGram).dividedBy(1000)
    : toDecimal(1);
}

/** Malzemenin bu bidondaki ek ücreti: kg başı ücret × bidon kilosu. */
/** Malzemenin bidondaki payı kadar ücreti; pay verilmezse bidonun tamamı üzerinden hesaplanır. */
export function ingredientExtra(
  pricePerKg: Decimal.Value,
  weightGram: number | null,
  share: number = FULL_SHARE,
): Decimal {
  return roundMoney(
    toDecimal(pricePerKg)
      .times(bidonKg(weightGram))
      .times(share)
      .dividedBy(FULL_SHARE),
  );
}

/** Aynı seçim aynı anahtarı üretir; sepette aynı bidon tek satırda toplanır. */
export function customizationKey(customization: StoredCustomization): string {
  const canonical = JSON.stringify([
    [...customization.ingredientIds].sort(),
    customization.brine,
    customization.spice,
    customization.note ?? "",
    // Oransız eski satırların anahtarı değişmesin.
    ...(customization.shares
      ? [
          Object.entries(customization.shares).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        ]
      : []),
  ]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 24);
}

/** Sepetteki JSON'u güvenle okur; tanınmayan veri null döner. */
export function readStoredCustomization(
  value: unknown,
): StoredCustomization | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<StoredCustomization>;
  if (raw.kind !== "custom-pickle" || !Array.isArray(raw.ingredientIds)) {
    return null;
  }
  if (!raw.brine || !(raw.brine in BRINE_OPTIONS)) return null;
  if (!raw.spice || !(raw.spice in SPICE_OPTIONS)) return null;
  return {
    kind: "custom-pickle",
    ingredientIds: raw.ingredientIds.filter(
      (id): id is string => typeof id === "string",
    ),
    ...(readShares(raw.shares) ? { shares: readShares(raw.shares) } : {}),
    brine: raw.brine,
    spice: raw.spice,
    note: typeof raw.note === "string" ? raw.note : null,
  };
}

function readShares(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export interface BuilderSize {
  variantId: string;
  label: string;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  weightGram: number | null;
  inStock: boolean;
}

export interface BuilderData {
  productName: string;
  description: string | null;
  sizes: BuilderSize[];
  ingredients: IngredientView[];
  brines: PickleBrineOption[];
  spices: PickleSpiceOption[];
}

export interface PreparedCustomPickle {
  variantId: string;
  quantity: number;
  customization: StoredCustomization;
  key: string;
}

export class CustomPickleService
  implements CustomizationPricer, ItemCustomizationHandler
{
  constructor(
    private readonly repository: CustomPickleRepository,
    private readonly priceResolver: PriceResolver,
    private readonly audit?: AuditLogger,
  ) {}

  async getOptions(): Promise<CustomPickleConfig> {
    const config = await this.repository.getPickleOptions();
    registerOptions(config);
    return config;
  }

  /** Bu ürün özelleştirilebilir mi? (Kendi Turşunu Yap bidonu) */
  isCustomizable(productSlug: string): boolean {
    return productSlug === CUSTOM_PICKLE_PRODUCT_SLUG;
  }

  /** Standart ekleme denenirse gösterilecek mesaj */
  getStandardAddErrorMessage(productSlug: string): string {
    if (productSlug === CUSTOM_PICKLE_PRODUCT_SLUG) {
      return 'Bu bidon "Kendi Turşunu Yap" sayfasından malzeme seçilerek oluşturulur';
    }
    return "Bu ürün özelleştirilerek sepete eklenmelidir";
  }

  /** Özel satırın geçerli olduğunu doğrular */
  validateCustomItem(productSlug: string, customization: unknown): void {
    if (productSlug !== CUSTOM_PICKLE_PRODUCT_SLUG) {
      throw new ValidationError("Bu ürün özelleştirilemez");
    }
    const read = readStoredCustomization(customization);
    if (!read) {
      throw new ValidationError("Geçersiz seçim");
    }
  }

  /** Yapıcı sayfası için bidon boyutları (müşteri fiyatıyla) ve aktif malzemeler. */
  async getBuilder(context: PricingContext): Promise<BuilderData | null> {
    const product = await this.repository.findBuilderProduct(
      CUSTOM_PICKLE_PRODUCT_SLUG,
    );
    if (!product || product.status !== "ACTIVE") return null;

    const variants = product.variants.filter((variant) => variant.isActive);
    if (variants.length === 0) return null;

    const [prices, ingredients, options] = await Promise.all([
      this.priceResolver.resolveUnitPrices(
        variants.map((variant) => ({
          variantId: variant.id,
          listPrice: variant.price,
          quantity: 1,
        })),
        context,
      ),
      this.repository.listIngredients({ activeOnly: true }),
      this.getOptions(),
    ]);

    return {
      productName: product.name,
      description: product.description,
      sizes: variants.map((variant) => {
        const available = availableQuantity({
          trackInventory: product.trackInventory,
          stockQuantity: variant.stockQuantity,
          reservedQuantity: variant.reservedQuantity,
        });
        return {
          variantId: variant.id,
          label: variant.label,
          price: (prices.get(variant.id) ?? toDecimal(variant.price)).toFixed(
            2,
          ),
          compareAtPrice: variant.compareAtPrice
            ? toDecimal(variant.compareAtPrice).toFixed(2)
            : null,
          currency: variant.currency,
          weightGram: bidonWeightGram(variant.weightGram, variant.label),
          inStock: available === null || available > 0,
        };
      }),
      ingredients: ingredients.map((item) => toView(item)),
      brines: options.brines
        .filter((item) => item.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      spices: options.spices
        .filter((item) => item.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  /** Müşteri seçimini doğrular ve sepete eklenecek biçime getirir. */
  async prepare(raw: unknown): Promise<PreparedCustomPickle> {
    const parsed = customPickleInputSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError(firstIssue(parsed.error));
    const input = parsed.data;

    const product = await this.repository.findBuilderProduct(
      CUSTOM_PICKLE_PRODUCT_SLUG,
    );
    const variant = product?.variants.find(
      (item) => item.id === input.variantId,
    );
    if (!product || product.status !== "ACTIVE" || !variant?.isActive) {
      throw new NotFoundError("Bidon boyutu");
    }

    const weightGram = bidonWeightGram(variant.weightGram, variant.label);
    const maxIngredients = maxIngredientsForSize(weightGram);
    if (input.ingredientIds.length > maxIngredients) {
      throw new ValidationError(
        `Bu bidon boyutunda en fazla ${maxIngredients} malzeme seçebilirsiniz`,
      );
    }

    const ingredients = await this.repository.findIngredients(
      input.ingredientIds,
    );
    const active = ingredients.filter((item) => item.isActive);
    if (active.length !== input.ingredientIds.length) {
      throw new ConflictError(
        "Seçtiğiniz malzemelerden biri artık mevcut değil, lütfen seçiminizi güncelleyin",
      );
    }
    const currentMonth = new Date().getMonth() + 1;
    const unavailable = active.find(
      (item) =>
        !isStockAvailable(item.stockKg) ||
        !isMonthInSeason(
          item.seasonStartMonth,
          item.seasonEndMonth,
          currentMonth,
        ),
    );
    if (unavailable) {
      if (!isStockAvailable(unavailable.stockKg)) {
        throw new ConflictError(
          `"${unavailable.name}" malzemesi tükendiği için seçilemez`,
        );
      }
      throw new ConflictError(
        `"${unavailable.name}" malzemesi mevsim dışı olduğu için seçilemez`,
      );
    }
    if (!active.some((item) => item.group === "VEGETABLE")) {
      throw new ValidationError("Bidona en az bir sebze eklemelisiniz");
    }

    const vegetableIds = active
      .filter((item) => item.group === "VEGETABLE")
      .map((item) => item.id);
    // Oran gönderilmediyse sebzeler eşit dağıtılır; gönderildiyse bidonu tam doldurmalı.
    const shares = input.shares ?? equalShares(vegetableIds);
    if (!sharesAreValid(shares, vegetableIds)) {
      throw new ValidationError(
        "Sebze oranları %10'luk adımlarla toplam %100 olmalıdır",
      );
    }

    const options = await this.getOptions();
    const activeBrines = new Set(
      options.brines.filter((item) => item.isActive).map((item) => item.key),
    );
    const activeSpices = new Set(
      options.spices.filter((item) => item.isActive).map((item) => item.key),
    );
    if (
      activeBrines.size > 0 &&
      !activeBrines.has(input.brine) &&
      !(input.brine in BRINE_OPTIONS)
    ) {
      throw new ValidationError("Seçtiğiniz salamura seçeneği mevcut değil");
    }
    if (
      activeSpices.size > 0 &&
      !activeSpices.has(input.spice) &&
      !(input.spice in SPICE_OPTIONS)
    ) {
      throw new ValidationError("Seçtiğiniz acılık seçeneği mevcut değil");
    }

    const customization: StoredCustomization = {
      kind: "custom-pickle",
      ingredientIds: input.ingredientIds,
      shares,
      brine: input.brine,
      spice: input.spice,
      note: input.note,
    };

    return {
      variantId: variant.id,
      quantity: input.quantity,
      customization,
      key: customizationKey(customization),
    };
  }

  /** Sepet/checkout satırları için güncel ek ücretleri ve özetleri hesaplar. */
  async quote(
    lines: (
      | CustomizationLineItem
      | { customization: StoredCustomization; weightGram: number | null }
    )[],
  ): Promise<(CustomizationQuote | undefined)[]> {
    const parsedLines = lines.map((line) => {
      // Satır özelleştirme anahtarı boş string olarak verilmişse standart satırdır
      if ("customizationKey" in line && line.customizationKey === "") {
        return null;
      }
      if (!line.customization) return null;

      const stored = readStoredCustomization(line.customization);
      if (!stored) return null;

      const weightGram =
        line.weightGram !== undefined &&
        line.weightGram !== null &&
        line.weightGram > 0 &&
        !("optionLabels" in line && line.optionLabels?.length)
          ? line.weightGram
          : bidonWeightGram(
              line.weightGram ?? null,
              "optionLabels" in line && line.optionLabels
                ? line.optionLabels.join(" ")
                : null,
            );
      return { stored, weightGram };
    });

    const activeEntries = parsedLines.filter(
      (
        entry,
      ): entry is { stored: StoredCustomization; weightGram: number | null } =>
        entry !== null,
    );

    if (activeEntries.length === 0) {
      return lines.map(() => undefined);
    }

    const ids = [
      ...new Set(activeEntries.flatMap((line) => line.stored.ingredientIds)),
    ];
    const [rawIngredients, options] = await Promise.all([
      this.repository.findIngredients(ids),
      this.getOptions(),
    ]);
    const records = new Map(rawIngredients.map((item) => [item.id, item]));
    const brineLabels = new Map(
      options.brines.map((item) => [item.key, item.label]),
    );
    const spiceLabels = new Map(
      options.spices.map((item) => [item.key, item.label]),
    );

    return parsedLines.map((entry) => {
      if (!entry) return undefined;
      const { stored: customization, weightGram } = entry;
      const found = customization.ingredientIds
        .map((id) => records.get(id))
        .filter((item): item is IngredientRecord => item !== undefined)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"),
        );
      const currentMonth = new Date().getMonth() + 1;
      const available =
        found.length === customization.ingredientIds.length &&
        found.every(
          (item) =>
            item.isActive &&
            isStockAvailable(item.stockKg) &&
            isMonthInSeason(
              item.seasonStartMonth,
              item.seasonEndMonth,
              currentMonth,
            ),
        );

      const priced = found.map((item) => {
        const share = customization.shares?.[item.id];
        return {
          id: item.id,
          name: item.name,
          share,
          extra: ingredientExtra(item.pricePerKg, weightGram, share),
        };
      });
      const extra = priced.reduce(
        (sum, item) => sum.plus(item.extra),
        toDecimal(0),
      );

      const brine =
        brineLabels.get(customization.brine) ??
        BRINE_OPTIONS[customization.brine] ??
        customization.brine;
      const spice =
        spiceLabels.get(customization.spice) ??
        SPICE_OPTIONS[customization.spice] ??
        customization.spice;
      const parts = [
        priced
          .map((item) =>
            item.share === undefined
              ? item.name
              : `${item.name} %${item.share}`,
          )
          .join(", "),
        brine,
        spice,
      ];
      if (customization.note) parts.push(`Not: ${customization.note}`);

      return {
        extra,
        available,
        summary: parts.join(" · "),
        snapshot: {
          kind: "custom-pickle",
          ingredients: priced.map((item) => ({
            id: item.id,
            name: item.name,
            unitExtra: item.extra.toFixed(2),
            ...(item.share === undefined ? {} : { share: item.share }),
          })),
          brine,
          spice,
          note: customization.note,
        },
      };
    });
  }
}
