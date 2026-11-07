/**
 * Barkodu geçerli bir GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) ise normalize edip
 * döner; aksi halde null. Google, geçersiz GTIN içeren ürünü reddettiği için
 * kontrol basamağı da doğrulanır.
 */
export function validGtin(barcode: string | null | undefined): string | null {
  if (!barcode) return null;
  const digits = barcode.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits) || ![8, 12, 13, 14].includes(digits.length)) {
    return null;
  }

  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    // Sağdan sola: kontrol basamağına en yakın basamak 3 ile çarpılır.
    const digit = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits.at(-1)) ? digits : null;
}
