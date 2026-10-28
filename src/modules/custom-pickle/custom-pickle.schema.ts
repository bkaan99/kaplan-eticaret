import { z } from "zod";
import {
  BRINE_OPTIONS,
  MAX_INGREDIENTS,
  MAX_NOTE_LENGTH,
  SPICE_OPTIONS,
} from "./custom-pickle.types";

const brineKeys = Object.keys(BRINE_OPTIONS) as [
  keyof typeof BRINE_OPTIONS,
  ...(keyof typeof BRINE_OPTIONS)[],
];
const spiceKeys = Object.keys(SPICE_OPTIONS) as [
  keyof typeof SPICE_OPTIONS,
  ...(keyof typeof SPICE_OPTIONS)[],
];

/** Müşterinin oluşturduğu bidon; malzemelerin geçerliliğini servis ayrıca denetler. */
export const customPickleInputSchema = z.object({
  variantId: z.string().min(1, "Bidon boyutu seçin"),
  ingredientIds: z
    .array(z.string().min(1))
    .min(1, "En az bir malzeme seçin")
    .max(MAX_INGREDIENTS, `En fazla ${MAX_INGREDIENTS} malzeme seçebilirsiniz`)
    .transform((ids) => [...new Set(ids)].sort()),
  brine: z.enum(brineKeys, { message: "Salamura türü seçin" }),
  spice: z.enum(spiceKeys, { message: "Acılık seçin" }),
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, `Not en fazla ${MAX_NOTE_LENGTH} karakter olabilir`)
    .optional()
    .transform((value) => (value ? value : null)),
  quantity: z.number().int().min(1).max(20).default(1),
});

export type CustomPickleInput = z.infer<typeof customPickleInputSchema>;

/** Yönetim panelindeki malzeme formu. */
export const ingredientInputSchema = z.object({
  name: z.string().trim().min(2, "Malzeme adı en az 2 karakter olmalı").max(60),
  group: z.enum(["VEGETABLE", "AROMA"]),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : null)),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : null))
    .refine(
      (value) =>
        value === null || value.startsWith("/") || /^https?:\/\//.test(value),
      "Görsel adresi / veya http(s):// ile başlamalı",
    ),
  pricePerKg: z.union([z.string(), z.number()]).transform((value, ctx) => {
    const parsed = Number(String(value).replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir ücret girin" });
      return z.NEVER;
    }
    return parsed;
  }),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export type IngredientInput = z.infer<typeof ingredientInputSchema>;
