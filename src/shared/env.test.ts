import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "./env";

const validSource = {
  NODE_ENV: "development",
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "a".repeat(32),
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  MAIL_FROM: "no-reply@localhost",
};

const captchaOff = { captcha: false };

describe("parseEnv", () => {
  it("geçerli değerleri tiplerine çevirir", () => {
    const env = parseEnv(validSource, captchaOff);
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.NODE_ENV).toBe("development");
  });

  it("kısa AUTH_SECRET'ı reddeder", () => {
    expect(() =>
      parseEnv({ ...validSource, AUTH_SECRET: "kisa" }, captchaOff),
    ).toThrow(EnvValidationError);
  });

  it("geçersiz APP_URL'yi reddeder", () => {
    expect(() =>
      parseEnv({ ...validSource, APP_URL: "adres-degil" }, captchaOff),
    ).toThrow(EnvValidationError);
  });

  it("boş string'i tanımsız sayar", () => {
    const env = parseEnv({ ...validSource, PAYTR_MERCHANT_ID: "" }, captchaOff);
    expect(env.PAYTR_MERCHANT_ID).toBeUndefined();
  });

  it("production'da CRON_SECRET yoksa reddeder", () => {
    expect(() =>
      parseEnv({ ...validSource, NODE_ENV: "production" }, captchaOff),
    ).toThrow(/CRON_SECRET/);
  });

  it("production'da PayTR tamamen boşsa staging için kabul eder", () => {
    expect(() =>
      parseEnv(
        {
          ...validSource,
          NODE_ENV: "production",
          CRON_SECRET: "cron-secret-value",
        },
        captchaOff,
      ),
    ).not.toThrow();
  });

  it("production'da kısmi PayTR anahtarlarını reddeder", () => {
    expect(() =>
      parseEnv(
        {
          ...validSource,
          NODE_ENV: "production",
          CRON_SECRET: "cron-secret-value",
          PAYTR_MERCHANT_ID: "1",
        },
        captchaOff,
      ),
    ).toThrow(/PAYTR_MERCHANT_KEY/);
  });

  it("production'da PayTR anahtarları varsa kabul eder", () => {
    const env = parseEnv(
      {
        ...validSource,
        NODE_ENV: "production",
        CRON_SECRET: "cron-secret-value",
        PAYTR_MERCHANT_ID: "1",
        PAYTR_MERCHANT_KEY: "k",
        PAYTR_MERCHANT_SALT: "s",
      },
      captchaOff,
    );
    expect(env.PAYTR_MERCHANT_KEY).toBe("k");
  });

  it("captcha açıkken Turnstile anahtarlarını zorunlu kılar", () => {
    expect(() => parseEnv(validSource, { captcha: true })).toThrow(
      /TURNSTILE_SITE_KEY/,
    );
  });

  it("captcha kapalıyken Turnstile anahtarı istemez", () => {
    expect(() => parseEnv(validSource, captchaOff)).not.toThrow();
  });

  describe("derleme aşaması (next build)", () => {
    const build = { NEXT_PHASE: "phase-production-build" };

    it("eksik zorunlu değişkenlere yer tutucu verir", () => {
      const env = parseEnv(build, captchaOff);
      expect(env.APP_URL).toBe("http://localhost:3000");
      expect(env.SMTP_PORT).toBe(1025);
    });

    it("verilen gerçek değerleri yer tutucuyla ezmez", () => {
      const env = parseEnv(
        { ...build, APP_URL: "https://kaplan.example.com" },
        captchaOff,
      );
      expect(env.APP_URL).toBe("https://kaplan.example.com");
    });

    it("captcha açıkken Turnstile anahtarı yokken de derlenir", () => {
      expect(() => parseEnv(build, { captcha: true })).not.toThrow();
    });

    it("derleme dışında yer tutucu verilmez: eksik değişken hata fırlatır", () => {
      expect(() => parseEnv({}, captchaOff)).toThrow(EnvValidationError);
      expect(() =>
        parseEnv({ NEXT_PHASE: "phase-production-server" }, captchaOff),
      ).toThrow(EnvValidationError);
    });
  });
});
