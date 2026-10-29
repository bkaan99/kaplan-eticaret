import { z } from "zod";
import {
  MAX_INGREDIENTS,
  MAX_NOTE_LENGTH,
} from "./custom-pickle.types";

/** Müşterinin oluşturduğu bidon; malzemelerin ve seçeneklerin geçerliliğini servis ayrıca denetler. */
export const customPickleInputSchema = z.object({
  variantId: z.string().min(1, "Bidon boyutu seçin"),
  ingredientIds: z
    .array(z.string().min(1))
    .min(1, "En az bir malzeme seçin")
    .max(MAX_INGREDIENTS, `En fazla ${MAX_INGREDIENTS} malzeme seçebilirsiniz`)
    .transform((ids) => [...new Set(ids)].sort()),
  brine: z.string().trim().min(1, "Salamura türü seçin"),
  spice: z.string().trim().min(1, "Acılık seçin"),
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, `Not en fazla ${MAX_NOTE_LENGTH} karakter olabilir`)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  quantity: z.number().int().min(1).max(20).default(1),
});

export type CustomPickleInput = z.infer<typeof customPickleInputSchema>;

/** Yönetim panelindeki salamura ve acılık seçenekleri şeması. */
export const pickleBrineOptionSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Anahtar en az 2 karakter olmalıdır")
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Anahtar yalnızca harf, rakam ve tire içerebilir")
    .transform((v) => v.toUpperCase()),
  label: z.string().trim().min(2, "Başlık en az 2 karakter olmalıdır").max(60),
  description: z.string().trim().max(300).default(""),
  color: z.string().trim().default("#d6e29a"),
  hasBubbles: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const pickleSpiceOptionSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Anahtar en az 2 karakter olmalıdır")
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Anahtar yalnızca harf, rakam ve tire içerebilir")
    .transform((v) => v.toUpperCase()),
  label: z.string().trim().min(2, "Başlık en az 2 karakter olmalıdır").max(60),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  peppers: z.coerce.number().int().min(0).max(5).default(0),
  tint: z.coerce.number().min(0).max(1).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const pickleOptionsConfigSchema = z.object({
  brines: z
    .array(pickleBrineOptionSchema)
    .min(1, "En az bir salamura seçeneği olmalıdır"),
  spices: z
    .array(pickleSpiceOptionSchema)
    .min(1, "En az bir acılık seçeneği olmalıdır"),
});

export type PickleOptionsConfigInput = z.infer<typeof pickleOptionsConfigSchema>;

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
