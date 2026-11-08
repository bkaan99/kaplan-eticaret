import { getEnv } from "@/shared/env";
import type { Mailer } from "./mailer";
import { SmtpMailer } from "./smtp-mailer";

/** Ortam ayarlarından e-posta gönderici kurar; çağıranlar somut sınıfı değil `Mailer` sözleşmesini bilir. */
export function createMailerFromEnv(): Mailer {
  const env = getEnv();
  return new SmtpMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    from: env.MAIL_FROM,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  });
}
