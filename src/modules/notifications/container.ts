import { siteConfig } from "@/config/site.config";
import { SmtpMailer } from "@/integrations/notification/smtp-mailer";
import { getCloudflareEnv } from "@/shared/cloudflare";
import { getDb } from "@/shared/db";
import { getEnv } from "@/shared/env";
import { getEventBus } from "@/shared/events";
import { getJobQueue } from "@/shared/queue";
import { getSiteUrl } from "@/shared/site-url";
import { D1OrderRepository } from "../orders/order.repository";
import { DirectNotificationDispatcher } from "./direct-notification-dispatcher";
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
    const env = getEnv();
    dispatcher = new DirectNotificationDispatcher(
      new SmtpMailer({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        from: env.MAIL_FROM,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      }),
    );
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

  return notifications;
}
