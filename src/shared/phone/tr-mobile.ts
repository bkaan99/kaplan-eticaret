/**
 * Türkiye cep telefonu yardımcıları (client + server güvenli; ağır geo import yok).
 */

/** Form input'ta izin verilen maksimum rakam (90XXXXXXXXXX = 12). */
export const TR_MOBILE_INPUT_MAX_DIGITS = 12;

/** Kayıtlı biçim: 05XXXXXXXXX */
export const TR_MOBILE_LOCAL_DIGITS = 11;

/**
 * Input'tan yalnızca rakam bırakır.
 * +90 / 90 önekliyken 12, yerel 05… iken 11, 5… iken 10 hane tutar —
 * böylece autofill/`+90 555…` ortada kesilmez.
 */
export function sanitizeTurkishMobileInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits.slice(0, 12);
  if (digits.startsWith("0")) return digits.slice(0, TR_MOBILE_LOCAL_DIGITS);
  if (digits.startsWith("5")) return digits.slice(0, 10);
  return digits.slice(0, TR_MOBILE_INPUT_MAX_DIGITS);
}

/** Türkiye cep telefonunu 05XXXXXXXXX biçimine getirir; geçersizse null. */
export function normalizeTurkishMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;

  if (local.startsWith("90") && local.length === 12) local = local.slice(2);
  if (local.length === 10 && local.startsWith("5")) local = `0${local}`;

  return /^05\d{9}$/.test(local) ? local : null;
}
