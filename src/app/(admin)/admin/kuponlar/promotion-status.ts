/**
 * Kupon/kampanya durumu — ödemedeki kontrollerle aynı sırada
 * (checkout-validator.assertCouponUsable): pasif → başlamadı → süresi doldu
 * → kota doldu. Panelde "Aktif" görünen kod müşteride de çalışır.
 */
export type PromotionStatus =
  "active" | "inactive" | "scheduled" | "expired" | "exhausted";

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  active: "Aktif",
  inactive: "Pasif",
  scheduled: "Başlamadı",
  expired: "Süresi doldu",
  exhausted: "Kota doldu",
};

export function promotionStatus(
  item: {
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
    usedCount?: number;
    maxUses?: number | null;
  },
  now: Date,
): PromotionStatus {
  if (!item.isActive) return "inactive";
  if (item.startsAt && new Date(item.startsAt) > now) return "scheduled";
  if (item.endsAt && new Date(item.endsAt) < now) return "expired";
  if (
    item.maxUses !== undefined &&
    item.maxUses !== null &&
    (item.usedCount ?? 0) >= item.maxUses
  ) {
    return "exhausted";
  }
  return "active";
}

/** Aktif ve `days` gün içinde bitecek mi? */
export function endsSoon(
  item: { endsAt: string | null },
  status: PromotionStatus,
  now: Date,
  days = 7,
): boolean {
  if (status !== "active" || !item.endsAt) return false;
  const left = new Date(item.endsAt).getTime() - now.getTime();
  return left >= 0 && left <= days * 24 * 60 * 60 * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * ISO tarih → `<input type="datetime-local">` değeri, tarayıcının yerel
 * saatinde. (Eski `iso.slice(0, 16)` UTC saatini yerel saat gibi gösteriyordu.)
 */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * `datetime-local` değeri (saat dilimsiz, yerel) → saat dilimli ISO.
 * Sunucu (UTC) saat dilimsiz metni UTC sanıp 3 saat kaydırıyordu.
 */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}
