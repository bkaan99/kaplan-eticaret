import "server-only";
import { revalidatePath } from "next/cache";
import { isAppError } from "@/shared/errors";
import { reportError } from "@/shared/error-reporter";

export interface StorefrontActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface StorefrontActionOptions {
  actionName?: string;
  context?: Record<string, unknown>;
  fallbackErrorMessage?: string;
  revalidate?: string[];
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Vitrin (Storefront) Server Action'larının ortak iskeleti:
 * - Başarılı handler çıktısını { ok: true, data } döner ve belirtilen sayfaları revalidate eder.
 * - Tanımlı domain hatalarını (AppError) kullanıcı dostu mesaj olarak yakalar.
 * - Beklenmeyen hataları ErrorReporter'a kaydeder ve genel bir hata mesajı döner.
 * - Next.js redirect() çağrılarını yutmaz, yönlendirmenin çalışması için yeniden fırlatır.
 */
export async function runStorefrontAction<T = void>(
  handler: () => Promise<T>,
  options: StorefrontActionOptions = {},
): Promise<StorefrontActionResult<T>> {
  try {
    const data = await handler();
    if (options.revalidate) {
      for (const path of options.revalidate) {
        revalidatePath(path);
      }
    }
    return { ok: true, data };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (isAppError(error)) {
      return { ok: false, error: error.message };
    }

    reportError(error, {
      action: options.actionName ?? "storefront",
      ...options.context,
    });

    return {
      ok: false,
      error:
        options.fallbackErrorMessage ??
        "İşlem tamamlanamadı, lütfen tekrar deneyin.",
    };
  }
}
