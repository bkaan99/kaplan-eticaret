import "server-only";
import { z } from "zod";
import { features, type Features } from "@/config/features";

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.url(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET en az 32 karakter olmalı"),
    DATABASE_URL: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    MAIL_FROM: z.string().min(1),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    PAYTR_MERCHANT_ID: optionalString,
    PAYTR_MERCHANT_KEY: optionalString,
    PAYTR_MERCHANT_SALT: optionalString,
    /** Production'da PayTR test modunu açar (canlıya geçmeden önce deneme için) */
    PAYTR_TEST_MODE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    /** Yüklenen dosyaların dizini; varsayılan ./uploads */
    UPLOAD_DIR: optionalString,
    /** R2 / CDN public kök (ör. https://cdn… veya r2.dev); boşsa /uploads */
    UPLOADS_PUBLIC_BASE_URL: optionalString,
    /** Opsiyonel: /cdn-cgi/image resizing (CF zone custom domain gerekir) */
    CF_IMAGE_RESIZING: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    /** Cloudflare Cron → /api/cron/* Bearer secret */
    CRON_SECRET: optionalString,
    TURNSTILE_SITE_KEY: optionalString,
    TURNSTILE_SECRET_KEY: optionalString,
    /** Workers queue consumer; yerelde SMTP kullanılır */
    RESEND_API_KEY: optionalString,
    /** Netgsm SMS (features.sms): abone no, şifre ve onaylı SMS başlığı */
    NETGSM_USERCODE: optionalString,
    NETGSM_PASSWORD: optionalString,
    NETGSM_MSGHEADER: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    // Derleme sırasında secret'lar yoktur (Cloudflare'de çalışma zamanında verilir);
    // cron uçları secret yokken zaten 401 verir (fail-closed).
    if (
      !env.CRON_SECRET &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CRON_SECRET"],
        message: "production ortamında CRON_SECRET zorunludur",
      });
    }

    const paytr = [
      env.PAYTR_MERCHANT_ID,
      env.PAYTR_MERCHANT_KEY,
      env.PAYTR_MERCHANT_SALT,
    ];
    const anyPaytr = paytr.some(Boolean);
    const allPaytr = paytr.every(Boolean);

    // Staging: üçü de boşsa DevPaymentProvider kullanılır.
    // Kısmi tanımlı PayTR production'da reddedilir.
    if (anyPaytr && !allPaytr) {
      for (const [index, key] of (
        [
          "PAYTR_MERCHANT_ID",
          "PAYTR_MERCHANT_KEY",
          "PAYTR_MERCHANT_SALT",
        ] as const
      ).entries()) {
        if (!paytr[index]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "production ortamında PayTR anahtarları eksiksiz olmalı",
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Ortam değişkenleri geçersiz:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
  }
}

/** Yalnızca ilgili özellik açıksa zorunlu olan anahtarlar. */
function featureIssues(env: Env, enabled: Pick<Features, "captcha">): string[] {
  const issues: string[] = [];

  if (enabled.captcha) {
    for (const key of ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const) {
      if (!env[key]) {
        issues.push(`${key}: captcha özelliği açıkken zorunludur`);
      }
    }
  }

  return issues;
}

export function parseEnv(
  source: Record<string, string | undefined>,
  enabled: Pick<Features, "captcha"> = features,
): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new EnvValidationError(issues);
  }

  const issues = featureIssues(result.data, enabled);
  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return result.data;
}

let cachedEnv: Env | undefined;

/** Doğrulanmış ortam değişkenlerini döndürür. Kodda process.env yerine bu kullanılır. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
