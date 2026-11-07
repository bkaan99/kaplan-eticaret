import type Decimal from "decimal.js";
import { asc, eq, inArray } from "drizzle-orm";
import { dec, pickleIngredient, product, setting, type Db } from "@/db";
import {
  DEFAULT_BRINE_CONFIG,
  DEFAULT_SPICE_CONFIG,
  type CustomPickleConfig,
  type IngredientGroup,
} from "./custom-pickle.types";
import type { IngredientInput } from "./custom-pickle.schema";

export interface IngredientRecord {
  id: string;
  name: string;
  slug: string;
  group: IngredientGroup;
  description: string | null;
  imageUrl: string | null;
  pricePerKg: Decimal;
  stockKg: Decimal | null;
  minStockKg: Decimal | null;
  seasonStartMonth: number | null;
  seasonEndMonth: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface BuilderVariantRecord {
  id: string;
  label: string;
  price: Decimal;
  compareAtPrice: Decimal | null;
  currency: string;
  weightGram: number | null;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
}

export interface BuilderProductRecord {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  trackInventory: boolean;
  imageUrl: string | null;
  variants: BuilderVariantRecord[];
}

export interface CustomPickleRepository {
  listIngredients(options: {
    activeOnly: boolean;
  }): Promise<IngredientRecord[]>;
  findIngredients(ids: string[]): Promise<IngredientRecord[]>;
  findIngredientBySlug(slug: string): Promise<{ id: string } | null>;
  createIngredient(input: IngredientInput & { slug: string }): Promise<string>;
  updateIngredient(id: string, input: IngredientInput): Promise<void>;
  deleteIngredient(id: string): Promise<void>;
  findBuilderProduct(slug: string): Promise<BuilderProductRecord | null>;
  getPickleOptions(): Promise<CustomPickleConfig>;
  savePickleOptions(config: CustomPickleConfig): Promise<void>;
}

const ingredientColumns = {
  id: pickleIngredient.id,
  name: pickleIngredient.name,
  slug: pickleIngredient.slug,
  group: pickleIngredient.group,
  description: pickleIngredient.description,
  imageUrl: pickleIngredient.imageUrl,
  pricePerKg: pickleIngredient.pricePerKg,
  stockKg: pickleIngredient.stockKg,
  minStockKg: pickleIngredient.minStockKg,
  seasonStartMonth: pickleIngredient.seasonStartMonth,
  seasonEndMonth: pickleIngredient.seasonEndMonth,
  isActive: pickleIngredient.isActive,
  sortOrder: pickleIngredient.sortOrder,
} as const;

export class D1CustomPickleRepository implements CustomPickleRepository {
  constructor(private readonly db: () => Db) {}

  listIngredients(options: {
    activeOnly: boolean;
  }): Promise<IngredientRecord[]> {
    return this.db()
      .select(ingredientColumns)
      .from(pickleIngredient)
      .where(
        options.activeOnly ? eq(pickleIngredient.isActive, true) : undefined,
      )
      .orderBy(
        asc(pickleIngredient.group),
        asc(pickleIngredient.sortOrder),
        asc(pickleIngredient.name),
      );
  }

  async findIngredients(ids: string[]): Promise<IngredientRecord[]> {
    if (ids.length === 0) return [];
    return this.db()
      .select(ingredientColumns)
      .from(pickleIngredient)
      .where(inArray(pickleIngredient.id, ids));
  }

  async findIngredientBySlug(slug: string): Promise<{ id: string } | null> {
    const [row] = await this.db()
      .select({ id: pickleIngredient.id })
      .from(pickleIngredient)
      .where(eq(pickleIngredient.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async createIngredient(
    input: IngredientInput & { slug: string },
  ): Promise<string> {
    const [created] = await this.db()
      .insert(pickleIngredient)
      .values({
        name: input.name,
        slug: input.slug,
        group: input.group,
        description: input.description,
        imageUrl: input.imageUrl,
        pricePerKg: dec(input.pricePerKg.toFixed(2)),
        stockKg:
          input.stockKg !== null && input.stockKg !== undefined
            ? dec(input.stockKg.toFixed(2))
            : null,
        minStockKg:
          input.minStockKg !== null && input.minStockKg !== undefined
            ? dec(input.minStockKg.toFixed(2))
            : null,
        seasonStartMonth: input.seasonStartMonth ?? null,
        seasonEndMonth: input.seasonEndMonth ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      })
      .returning({ id: pickleIngredient.id });
    return created!.id;
  }

  async updateIngredient(id: string, input: IngredientInput): Promise<void> {
    await this.db()
      .update(pickleIngredient)
      .set({
        name: input.name,
        group: input.group,
        description: input.description,
        imageUrl: input.imageUrl,
        pricePerKg: dec(input.pricePerKg.toFixed(2)),
        stockKg:
          input.stockKg !== null && input.stockKg !== undefined
            ? dec(input.stockKg.toFixed(2))
            : null,
        minStockKg:
          input.minStockKg !== null && input.minStockKg !== undefined
            ? dec(input.minStockKg.toFixed(2))
            : null,
        seasonStartMonth: input.seasonStartMonth ?? null,
        seasonEndMonth: input.seasonEndMonth ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      })
      .where(eq(pickleIngredient.id, id));
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.db().delete(pickleIngredient).where(eq(pickleIngredient.id, id));
  }

  async findBuilderProduct(slug: string): Promise<BuilderProductRecord | null> {
    const found = await this.db().query.product.findFirst({
      where: eq(product.slug, slug),
      columns: {
        id: true,
        name: true,
        description: true,
        status: true,
        trackInventory: true,
      },
      with: {
        images: {
          orderBy: (image, { asc }) => asc(image.position),
          limit: 1,
          columns: { url: true },
        },
        variants: {
          orderBy: (variant, { asc }) => asc(variant.price),
          with: {
            optionValues: {
              with: { optionValue: { columns: { value: true } } },
            },
          },
        },
      },
    });
    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      description: found.description,
      status: found.status,
      trackInventory: found.trackInventory,
      imageUrl: found.images[0]?.url ?? null,
      variants: found.variants.map((variant) => ({
        id: variant.id,
        label:
          variant.optionValues
            .map((item) => item.optionValue.value)
            .join(" / ") || variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        currency: variant.currency,
        weightGram: variant.weightGram,
        isActive: variant.isActive,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
      })),
    };
  }

  async getPickleOptions(): Promise<CustomPickleConfig> {
    try {
      const [record] = await this.db()
        .select()
        .from(setting)
        .where(eq(setting.key, "custom_pickle_options"))
        .limit(1);
      if (record && record.value && typeof record.value === "object") {
        const val = record.value as Partial<CustomPickleConfig>;
        if (Array.isArray(val.brines) && Array.isArray(val.spices)) {
          return { brines: val.brines, spices: val.spices };
        }
      }
    } catch {
      // Varsayılan yapılandırmaya dön
    }
    return { brines: DEFAULT_BRINE_CONFIG, spices: DEFAULT_SPICE_CONFIG };
  }

  async savePickleOptions(config: CustomPickleConfig): Promise<void> {
    await this.db()
      .insert(setting)
      .values({ key: "custom_pickle_options", value: config })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value: config, updatedAt: new Date() },
      });
  }
}
