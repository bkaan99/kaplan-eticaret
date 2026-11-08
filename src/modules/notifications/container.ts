import { isFeatureEnabled } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { createMailerFromEnv } from "@/integrations/notification/mailer-factory";
import { getCloudflareEnv } from "@/shared/cloudflare";
import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { getJobQueue } from "@/shared/queue";
import { getSiteUrl } from "@/shared/site-url";
import { D1OrderRepository } from "../orders/order.repository";
import { DirectNotificationDispatcher } from "./direct-notification-dispatcher";
import { SmsNotificationHandler } from "./handlers/sms-notification.handler";
import {
  QueueNotificationDispatcher,
  type NotificationDispatcher,
} from "./notification-dispatcher";
import { NotificationService } from "./notification.service";

let dispatcher: NotificationDispatcher | undefined;
let notifications: NotificationService | undefined;

/** Genel bildirim dağıtıcısı tekil örneği. */
export function getNotificationDispatcher(): NotificationDispatcher {
  if (dispatcher) return dispatcher;

  if (getCloudflareEnv()?.JOB_QUEUE) {
    dispatcher = new QueueNotificationDispatcher(getJobQueue());
  } else {
    dispatcher = new DirectNotificationDispatcher(createMailerFromEnv());
  }

  return dispatcher;
}

/** Bildirim servisi tekil örneği; domain olay dinleyicileri ilk başlatmada bağlanır. */
export function getNotificationService(): NotificationService {
  if (notifications) return notifications;

  notifications = new NotificationService(
    new D1OrderRepository(getDb),
    getNotificationDispatcher(),
    {
      siteName: siteConfig.name,
      baseUrl: getSiteUrl(),
    },
    siteConfig.contact.email,
    siteConfig.b2b.bankAccounts,
    siteConfig.currency,
  );

  const bus = getEventBus();
  const service = notifications;
  bus.subscribe("order.paid", ({ orderId }) => service.onOrderPaid(orderId));
  bus.subscribe("order.placed", ({ orderId, method }) =>
    service.onOrderPlaced(orderId, method),
  );
  bus.subscribe("order.cancelled", ({ orderId, refunded }) =>
    service.onOrderCancelled(orderId, refunded),
  );
  bus.subscribe("order.shipped", ({ orderId }) =>
    service.onOrderShipped(orderId),
  );

  // Kargo SMS'i: features.sms açıksa kuyruğa atılır; gönderimi kuyruk
  // tüketicisi (Netgsm) yapar. Sağlayıcı ayarı yoksa iş loglanıp atlanır.
  if (isFeatureEnabled("sms")) {
    const sms = new SmsNotificationHandler({
      orders: new D1OrderRepository(getDb),
      queue: getJobQueue(),
      context: { siteName: siteConfig.name, baseUrl: getSiteUrl() },
    });
    bus.subscribe("order.shipped", ({ orderId }) =>
      sms.onOrderShipped(orderId),
    );
  }

  return notifications;
}
