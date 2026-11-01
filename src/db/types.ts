import { customType, text } from "drizzle-orm/sqlite-core";
import Decimal from "decimal.js";

/** Para / oran alanları: SQLite'ta sayı (sıralama ve karşılaştırma için), uygulamada Decimal. */
export const decimal = customType<{
  data: Decimal;
  driverData: number | string;
}>({
  dataType: () => "numeric",
  toDriver: (value) => new Decimal(value).toNumber(),
  fromDriver: (value) => new Decimal(value),
});

/** Zaman damgası: ISO-8601 metin olarak saklanır (sözlüksel sıralama = zaman sırası), uygulamada Date. */
export const timestamp = customType<{
  data: Date;
  driverData: string | number;
}>({
  dataType: () => "datetime",
  toDriver: (value) => value.toISOString(),
  fromDriver: (value) => {
    if (typeof value === "number") return new Date(value);
    if (/^\d+$/.test(value)) return new Date(Number(value));
    // SQLite CURRENT_TIMESTAMP biçimi: "YYYY-MM-DD HH:MM:SS" (UTC)
    return new Date(
      value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
    );
  },
});

/** JSON alan: metin olarak saklanır. */
export const json = <T = unknown>(name: string) =>
  text(name, { mode: "json" }).$type<T>();

/** Birincil anahtar üretici. */
export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Null-güvenli Decimal dönüşümü (zod'dan gelen number/string değerleri için). */
export function dec(value: Decimal.Value): Decimal;
export function dec(value: Decimal.Value | null | undefined): Decimal | null;
export function dec(value: Decimal.Value | null | undefined): Decimal | null {
  return value === null || value === undefined ? null : new Decimal(value);
}
