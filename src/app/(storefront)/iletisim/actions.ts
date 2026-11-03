"use server";

import { z } from "zod";
import { siteConfig } from "@/config/site.config";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { getNotificationDispatcher } from "@/modules/notifications/container";
import { isAppError } from "@/shared/errors";
import { logger } from "@/shared/logger";
import {
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";

const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Lütfen adınızı ve soyadınızı giriniz.")
    .max(80, "Ad soyad en fazla 80 karakter olabilir."),
  email: z
    .string()
    .trim()
    .email("Lütfen geçerli bir e-posta adresi giriniz."),
  phone: z
    .string()
    .trim()
    .min(10, "Lütfen en az 10 haneli geçerli bir telefon numarası giriniz.")
    .max(20, "Telefon numarası çok uzun."),
  subject: z
    .string()
    .trim()
    .min(2, "Lütfen mesajınız için bir konu seçiniz.")
    .max(120),
  message: z
    .string()
    .trim()
    .min(10, "Lütfen en az 10 karakterlik bir mesaj yazınız.")
    .max(3000, "Mesajınız çok uzun (en fazla 3000 karakter)."),
});

export interface ContactFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function sendContactMessageAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] ??= issue.message;
    }
    return {
      error: "Lütfen formdaki eksik veya hatalı alanları kontrol ediniz.",
      fieldErrors,
    };
  }

  try {
    const ip = await getClientIp();
    // Saatte en fazla 5 iletişim mesajı gönderilebilir
    await enforceRateLimit("contact-form", ip, {
      limit: 5,
      windowSeconds: 60 * 60,
    });

    const contactSettings = await getCachedContactSettings();
    const adminEmail = contactSettings.email || siteConfig.contact.email;

    const { fullName, email, phone, subject, message } = parsed.data;

    const emailSubject = `[İletişim Formu] ${subject} - ${fullName}`;
    const textContent = `
Yeni İletişim Formu Mesajı

Ad Soyad: ${fullName}
E-Posta: ${email}
Telefon: ${phone}
Konu: ${subject}

Mesaj:
${message}
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #154734; padding: 20px 24px;">
      <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Yeni İletişim Formu Mesajı</h2>
      <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 13px;">${siteConfig.name} web sitesi üzerinden gönderildi</p>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 110px;">Ad Soyad:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${fullName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">E-Posta:</td>
          <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #154734; text-decoration: underline;">${email}</a></td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Telefon:</td>
          <td style="padding: 10px 0;"><a href="tel:${phone}" style="color: #154734; text-decoration: underline;">${phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Konu:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${subject}</td>
        </tr>
      </table>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Mesaj Metni:</h4>
        <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.6;">${message}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      const dispatcher = getNotificationDispatcher();
      await dispatcher.dispatch(adminEmail, {
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      });
    } catch (dispatchError) {
      logger.warn(
        { err: dispatchError, email, fullName },
        "İletişim formu bildirimi gönderilirken uyarı oluştu",
      );
    }

    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return {
      error:
        "Mesajınız iletilirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.",
    };
  }
}
