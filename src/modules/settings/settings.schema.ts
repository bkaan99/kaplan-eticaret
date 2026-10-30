import { z } from "zod";

export const contactSettingsSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Geçerli bir telefon numarası girin")
    .max(35, "Telefon en fazla 35 karakter olabilir"),
  whatsapp: z
    .string()
    .trim()
    .max(35, "WhatsApp numarası en fazla 35 karakter olabilir")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi girin")
    .max(100),
  address: z
    .string()
    .trim()
    .min(3, "Adres en az 3 karakter olmalıdır")
    .max(300),
  workingHours: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  instagramUrl: z
    .string()
    .trim()
    .max(250)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  facebookUrl: z
    .string()
    .trim()
    .max(250)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
