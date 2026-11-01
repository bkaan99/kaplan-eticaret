import Decimal from "decimal.js";

export const DEFAULT_CURRENCY = "TRY";
export const DEFAULT_LOCALE = "tr-TR";

/** Yüzde alanları için ölçek: %1.00 → 10000 (baz 10_000). */
export const PERCENT_SCALE = 10_000;

/** Desi için ölçek: 1.5 desi → 1500. */
export const DESI_MILLI_SCALE = 1_000;

export type MoneyInput = Decimal.Value;

/** Para hesabı için Decimal üretir. Kuruş hatası olmaması için number ile hesap yapılmaz. */
export function toDecimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

/** Tutarı 2 basamağa yuvarlar (yarıdan yukarı). */
export function roundMoney(value: MoneyInput): Decimal {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Major birimi (₺) kuruşa (minor Int) çevirir. */
export function toMinor(value: MoneyInput): number {
  return roundMoney(value).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/** Kuruşu major Decimal'e çevirir. */
export function fromMinor(minor: number): Decimal {
  return toDecimal(minor).dividedBy(100);
}

/** Yüzde değerini ölçekli Int'e çevirir (%1 → 10000). */
export function toPercentUnits(value: MoneyInput): number {
  return toDecimal(value)
    .times(PERCENT_SCALE)
    .dividedBy(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function fromPercentUnits(units: number): Decimal {
  return toDecimal(units).times(100).dividedBy(PERCENT_SCALE);
}

export function toDesiMilli(value: MoneyInput): number {
  return toDecimal(value)
    .times(DESI_MILLI_SCALE)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function fromDesiMilli(milli: number): Decimal {
  return toDecimal(milli).dividedBy(DESI_MILLI_SCALE);
}

/** Yalnızca görüntüleme içindir; hesaplamada kullanılmaz. */
export function formatMoney(
  value: MoneyInput,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(roundMoney(value).toNumber());
}
