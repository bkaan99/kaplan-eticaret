import { normalizeTrMobile } from "@/integrations/notification/netgsm-sms";
import { logger } from "@/shared/logger";
import type { JobQueue } from "@/shared/queue";
import type { OrderLookupRepository } from "../../orders/order.repository";
import { renderOrderShippedSms } from "../templates/order-sms";

export const JOB_SEND_SMS = "sms.send";
export const DEFAULT_SMS_RETRY_LIMIT = 3;

export interface SmsNotificationHandlerDeps {
  orders: OrderLookupRepository;
  queue: JobQueue;
  context: { siteName: string; baseUrl: string };
}

/**
 * Sipariş olaylarında müşteriye SMS işi kuyruğa atar. Gönderimi kuyruk
 * tüketicisi yapar ve hata olursa yeniden dener. Buradaki hiçbir hata
 * siparişi güncelleyen işlemi (ör. admin "Kargoya ver") bozmaz.
 */
export class SmsNotificationHandler {
  constructor(private readonly deps: SmsNotificationHandlerDeps) {}

  async onOrderShipped(orderId: string): Promise<void> {
    try {
      const order = await this.deps.orders.findById(orderId);
      if (!order) {
        logger.warn(
          { orderId, event: "order.shipped" },
          "SMS: sipariş bulunamadı",
        );
        return;
      }

      const to = normalizeTrMobile(order.shippingAddress.phone);
      if (!to) {
        logger.warn(
          { orderNumber: order.orderNumber },
          "SMS: teslimat adresinde geçerli cep numarası yok, atlandı",
        );
        return;
      }

      await this.deps.queue.enqueue(
        JOB_SEND_SMS,
        { to, text: renderOrderShippedSms(order, this.deps.context) },
        {
          retryLimit: DEFAULT_SMS_RETRY_LIMIT,
          singletonKey: `sms:shipped:${order.id}`,
        },
      );
    } catch (error) {
      logger.error({ err: error, orderId }, "Kargo SMS'i kuyruğa alınamadı");
    }
  }
}
