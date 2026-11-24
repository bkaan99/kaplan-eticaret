"use server";

import { z } from "zod";
import { siteConfig } from "@/config/site.config";
import { getCachedContactSettings } from "@/modules/settings/cached";
import { getNotificationDispatcher } from "@/modules/notifications/container";
import { escapeHtml } from "@/modules/notifications/templates/layout";
import { getWholesaleLeadService } from "@/modules/wholesale/container";
import { verifyCaptcha } from "@/shared/captcha";
import { isAppError } from "@/shared/errors";
import { logger } from "@/shared/logger";
import {
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";
import {
  BUSINESS_TYPES,
  CONTACT_CHANNELS,
  ORDER_VOLUMES,
} from "./wholesale-options";

const wholesaleSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Lütfen adınızı / firma adınızı giriniz.")
    .max(120, "Ad / firma adı en fazla 120 karakter olabilir."),
  email: z
    .string()
    .trim()
    .email("Lütfen geçerli bir e-posta adresi giriniz."),
  phone: z
    .string()
    .trim()
    .min(10, "Lütfen en az 10 haneli geçerli bir telefon numarası giriniz.")
    .max(20, "Telefon numarası çok uzun."),
  city: z
    .string()
    .trim()
    .min(2, "Lütfen şehir / ilçe bilgisini giriniz.")
    .max(80, "Şehir / ilçe en fazla 80 karakter olabilir."),
  businessType: z.enum(BUSINESS_TYPES, {
    error: "Lütfen işletme türünü seçiniz.",
  }),
  orderVolume: z.enum(ORDER_VOLUMES, {
    error: "Lütfen planlanan alım miktarını seçiniz.",
  }),
  details: z
    .string()
    .trim()
    .max(2000, "Açıklama en fazla 2000 karakter olabilir.")
    .optional()
    .transform((value) => value || null),
  contactChannels: z
    .array(z.enum(CONTACT_CHANNELS))
    .min(1, "En az bir iletişim kanalı seçiniz."),
  note: z
    .string()
    .trim()
    .max(1000, "Not en fazla 1000 karakter olabilir.")
    .optional()
    .transform((value) => value || null),
});

export interface WholesaleFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function readChannels(formData: FormData): string[] {
  return formData
    .getAll("contactChannels")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function sendWholesaleQuoteAction(
  _prev: WholesaleFormState,
  formData: FormData,
): Promise<WholesaleFormState> {
  const parsed = wholesaleSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    businessType: formData.get("businessType"),
    orderVolume: formData.get("orderVolume"),
    details: formData.get("details") || undefined,
    contactChannels: readChannels(formData),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return {
      error: "Lütfen formdaki eksik veya hatalı alanları kontrol ediniz.",
      fieldErrors,
    };
  }

  try {
    const ip = await getClientIp();
    await enforceRateLimit("wholesale-form", ip, {
      limit: 5,
      windowSeconds: 60 * 60,
    });
    await verifyCaptcha(
      String(formData.get("cf-turnstile-response") ?? "") || null,
      ip,
    );

    const data = parsed.data;
    await getWholesaleLeadService().create(data);

    const contactSettings = await getCachedContactSettings();
    const adminEmail = contactSettings.email || siteConfig.contact.email;
    const channels = data.contactChannels.join(", ");

    const emailSubject = `[Toptan Teklif] ${data.companyName} — ${data.businessType}`;
    const textContent = `
Yeni Toptan Fiyat Teklifi Talebi

Ad / Firma: ${data.companyName}
E-Posta: ${data.email}
Telefon: ${data.phone}
Şehir / İlçe: ${data.city}
İşletme Türü: ${data.businessType}
Planlanan Miktar: ${data.orderVolume}
İletişim Tercihi: ${channels}

Açıklama:
${data.details ?? "—"}

Not:
${data.note ?? "—"}
    `.trim();

    const row = (label: string, value: string, href?: string) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">${escapeHtml(label)}</td>
        <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">
          ${
            href
              ? `<a href="${escapeHtml(href)}" style="color: #154734; text-decoration: underline;">${escapeHtml(value)}</a>`
              : escapeHtml(value)
          }
        </td>
      </tr>`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
    <div style="background-color: #154734; padding: 20px 24px;">
      <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Yeni Toptan Teklif Talebi</h2>
      <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 13px;">${escapeHtml(siteConfig.name)} — /toptan formu</p>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        ${row("Ad / Firma", data.companyName)}
        ${row("E-Posta", data.email, `mailto:${data.email}`)}
        ${row("Telefon", data.phone, `tel:${data.phone}`)}
        ${row("Şehir / İlçe", data.city)}
        ${row("İşletme Türü", data.businessType)}
        ${row("Miktar", data.orderVolume)}
        ${row("İletişim", channels)}
      </table>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Açıklama</h4>
        <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${escapeHtml(data.details ?? "—")}</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Not</h4>
        <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${escapeHtml(data.note ?? "—")}</p>
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
        { err: dispatchError, email: data.email, companyName: data.companyName },
        "Toptan teklif bildirimi gönderilirken uyarı oluştu",
      );
    }

    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return {
      error:
        "Talebiniz iletilirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.",
    };
  }
}
