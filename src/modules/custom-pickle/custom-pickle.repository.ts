import type Decimal from "decimal.js";
import type { PrismaClient } from "@/shared/prisma-client";
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

const ingredientSelect = {
  id: true,
  name: true,
  slug: true,
  group: true,
  description: true,
  imageUrl: true,
  pricePerKg: true,
  isActive: true,
  sortOrder: true,
} as const;

export class PrismaCustomPickleRepository implements CustomPickleRepository {
  constructor(private readonly db: () => PrismaClient) {}

  listIngredients(options: {
    activeOnly: boolean;
  }): Promise<IngredientRecord[]> {
    return this.db().pickleIngredient.findMany({
      where: options.activeOnly ? { isActive: true } : undefined,
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: ingredientSelect,
    });
  }

  findIngredients(ids: string[]): Promise<IngredientRecord[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db().pickleIngredient.findMany({
      where: { id: { in: ids } },
      select: ingredientSelect,
    });
  }

  findIngredientBySlug(slug: string): Promise<{ id: string } | null> {
    return this.db().pickleIngredient.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  async createIngredient(
    input: IngredientInput & { slug: string },
  ): Promise<string> {
    const created = await this.db().pickleIngredient.create({
      data: {
        name: input.name,
        slug: input.slug,
        group: input.group,
        description: input.description,
        imageUrl: input.imageUrl,
        pricePerKg: input.pricePerKg.toFixed(2),
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      select: { id: true },
    });
    return created.id;
  }

  async updateIngredient(id: string, input: IngredientInput): Promise<void> {
    await this.db().pickleIngredient.update({
      where: { id },
      data: {
        name: input.name,
        group: input.group,
        description: input.description,
        imageUrl: input.imageUrl,
        pricePerKg: input.pricePerKg.toFixed(2),
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.db().pickleIngredient.delete({ where: { id } });
  }

  async findBuilderProduct(slug: string): Promise<BuilderProductRecord | null> {
    const product = await this.db().product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        trackInventory: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
        variants: {
          orderBy: { price: "asc" },
          select: {
            id: true,
            price: true,
            compareAtPrice: true,
            currency: true,
            weightGram: true,
            isActive: true,
            stockQuantity: true,
            reservedQuantity: true,
            sku: true,
            optionValues: {
              select: { optionValue: { select: { value: true } } },
            },
          },
        },
      },
    });
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      status: product.status,
      trackInventory: product.trackInventory,
      imageUrl: product.images[0]?.url ?? null,
      variants: product.variants.map((variant) => ({
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
      const record = await this.db().setting.findUnique({
        where: { key: "custom_pickle_options" },
      });
      if (record && record.value && typeof record.value === "object") {
        const val = record.value as Partial<CustomPickleConfig>;
        if (Array.isArray(val.brines) && Array.isArray(val.spices)) {
          return {
            brines: val.brines,
            spices: val.spices,
          };
        }
      }
    } catch {
      // Varsayılan yapılandırmaya dön
    }
    return {
      brines: DEFAULT_BRINE_CONFIG,
      spices: DEFAULT_SPICE_CONFIG,
    };
  }

  async savePickleOptions(config: CustomPickleConfig): Promise<void> {
    await this.db().setting.upsert({
      where: { key: "custom_pickle_options" },
      update: { value: config as unknown as object },
      create: { key: "custom_pickle_options", value: config as unknown as object },
    });
  }
}
