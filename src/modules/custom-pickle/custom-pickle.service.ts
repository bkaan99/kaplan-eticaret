import { createHash } from "node:crypto";
import type Decimal from "decimal.js";
import type { Actor, AuditLogger } from "@/shared/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors";
import { roundMoney, toDecimal } from "@/shared/money";
import { slugify } from "@/shared/slug";
import { availableQuantity } from "../catalog/availability";
import type { PriceResolver, PricingContext } from "../catalog/pricing";
import type {
  CustomPickleRepository,
  IngredientRecord,
} from "./custom-pickle.repository";
import {
  customPickleInputSchema,
  ingredientInputSchema,
  pickleOptionsConfigSchema,
} from "./custom-pickle.schema";
import {
  bidonWeightGram,
  BRINE_OPTIONS,
  CUSTOM_PICKLE_PRODUCT_SLUG,
  SPICE_OPTIONS,
  type CustomPickleConfig,
  type CustomizationPricer,
  type CustomizationQuote,
  type IngredientView,
  type PickleBrineOption,
  type PickleSpiceOption,
  type StoredCustomization,
} from "./custom-pickle.types";

function firstIssue(error: { issues: readonly { message: string }[] }): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}

/** Bidonun kilogramı; tanımlı değilse 1 kg sayılır. */
export function bidonKg(weightGram: number | null): Decimal {
  return weightGram && weightGram > 0
    ? toDecimal(weightGram).dividedBy(1000)
    : toDecimal(1);
}

/** Malzemenin bu bidondaki ek ücreti: kg başı ücret × bidon kilosu. */
export function ingredientExtra(
  pricePerKg: Decimal.Value,
  weightGram: number | null,
): Decimal {
  return roundMoney(toDecimal(pricePerKg).times(bidonKg(weightGram)));
}

/** Aynı seçim aynı anahtarı üretir; sepette aynı bidon tek satırda toplanır. */
export function customizationKey(customization: StoredCustomization): string {
  const canonical = JSON.stringify([
    [...customization.ingredientIds].sort(),
    customization.brine,
    customization.spice,
    customization.note ?? "",
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
    brine: raw.brine,
    spice: raw.spice,
    note: typeof raw.note === "string" ? raw.note : null,
  };
}

function toView(record: IngredientRecord): IngredientView {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    group: record.group,
    description: record.description,
    imageUrl: record.imageUrl,
    pricePerKg: toDecimal(record.pricePerKg).toFixed(2),
    isActive: record.isActive,
    sortOrder: record.sortOrder,
  };
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

function registerOptions(config: CustomPickleConfig) {
  for (const b of config.brines) {
    BRINE_OPTIONS[b.key] = b.label;
  }
  for (const s of config.spices) {
    SPICE_OPTIONS[s.key] = s.label;
  }
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

export class CustomPickleService implements CustomizationPricer {
  constructor(
    private readonly repository: CustomPickleRepository,
    private readonly priceResolver: PriceResolver,
    private readonly audit?: AuditLogger,
  ) {}

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
      ingredients: ingredients.map(toView),
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

    const ingredients = await this.repository.findIngredients(
      input.ingredientIds,
    );
    const active = ingredients.filter((item) => item.isActive);
    if (active.length !== input.ingredientIds.length) {
      throw new ConflictError(
        "Seçtiğiniz malzemelerden biri artık mevcut değil, lütfen seçiminizi güncelleyin",
      );
    }
    if (!active.some((item) => item.group === "VEGETABLE")) {
      throw new ValidationError("Bidona en az bir sebze eklemelisiniz");
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
    lines: { customization: StoredCustomization; weightGram: number | null }[],
  ): Promise<CustomizationQuote[]> {
    const ids = [
      ...new Set(lines.flatMap((line) => line.customization.ingredientIds)),
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

    return lines.map(({ customization, weightGram }) => {
      const found = customization.ingredientIds
        .map((id) => records.get(id))
        .filter((item): item is IngredientRecord => item !== undefined)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"),
        );
      const available =
        found.length === customization.ingredientIds.length &&
        found.every((item) => item.isActive);

      const priced = found.map((item) => ({
        id: item.id,
        name: item.name,
        extra: ingredientExtra(item.pricePerKg, weightGram),
      }));
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
      const parts = [priced.map((item) => item.name).join(", "), brine, spice];
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
          })),
          brine,
          spice,
          note: customization.note,
        },
      };
    });
  }

  // --- Yönetim paneli ---

  /** Bidon boyutlarının yönetildiği ürünün kimliği (ürün düzenleme bağlantısı için). */
  async builderProductId(): Promise<string | null> {
    const product = await this.repository.findBuilderProduct(
      CUSTOM_PICKLE_PRODUCT_SLUG,
    );
    return product?.id ?? null;
  }

  async listIngredients(): Promise<IngredientView[]> {
    return (await this.repository.listIngredients({ activeOnly: false })).map(
      toView,
    );
  }

  async saveIngredient(
    id: string | null,
    raw: unknown,
    actor: Actor,
  ): Promise<void> {
    const parsed = ingredientInputSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError(firstIssue(parsed.error));
    const input = parsed.data;

    let savedId: string;
    if (id) {
      await this.repository.updateIngredient(id, input);
      savedId = id;
    } else {
      const base = slugify(input.name) || "malzeme";
      let slug = base;
      for (
        let suffix = 2;
        await this.repository.findIngredientBySlug(slug);
        suffix++
      ) {
        slug = `${base}-${suffix}`;
      }
      savedId = await this.repository.createIngredient({ ...input, slug });
    }

    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: id ? "pickle-ingredient.update" : "pickle-ingredient.create",
      entityType: "PickleIngredient",
      entityId: savedId,
      after: input,
    });
  }

  async deleteIngredient(id: string, actor: Actor): Promise<void> {
    await this.repository.deleteIngredient(id);
    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: "pickle-ingredient.delete",
      entityType: "PickleIngredient",
      entityId: id,
    });
  }

  async getOptions(): Promise<CustomPickleConfig> {
    const config = await this.repository.getPickleOptions();
    registerOptions(config);
    return config;
  }

  async saveOptions(raw: unknown, actor: Actor): Promise<void> {
    const parsed = pickleOptionsConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(firstIssue(parsed.error));
    }
    const before = await this.repository.getPickleOptions();
    await this.repository.savePickleOptions(parsed.data);
    registerOptions(parsed.data);

    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: "custom-pickle.options.update",
      entityType: "CustomPickleOptions",
      before,
      after: parsed.data,
    });
  }
}
