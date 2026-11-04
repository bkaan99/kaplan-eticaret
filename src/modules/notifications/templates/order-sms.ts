import { trackingUrl } from "@/shared/shipping/carriers";
import type { OrderView } from "@/modules/orders/order.types";

/**
 * Kargo SMS metni. Kısa tutulur (Türkçe karakterli SMS'te 1 parça ≈ 155
 * karakter); takip bağlantısı varsa onu, yoksa sipariş sayfasını verir.
 */
export function renderOrderShippedSms(
  order: Pick<
    OrderView,
    "orderNumber" | "lookupToken" | "carrier" | "trackingNumber"
  >,
  context: { siteName: string; baseUrl: string },
): string {
  const carrier =
    order.carrier && order.carrier !== "Diğer" ? `${order.carrier} ile ` : "";
  const tracking = order.trackingNumber
    ? ` Takip no: ${order.trackingNumber}.`
    : "";
  const link =
    trackingUrl(order.carrier, order.trackingNumber) ??
    `${context.baseUrl}/siparis/${order.orderNumber}?t=${order.lookupToken}`;

  return `${context.siteName}: ${order.orderNumber} numaralı siparişiniz ${carrier}kargoya verildi.${tracking} ${link}`;
}
