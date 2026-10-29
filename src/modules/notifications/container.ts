import { siteConfig } from "@/config/site.config";
import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { getJobQueue } from "@/shared/queue";
import { getSiteUrl } from "@/shared/site-url";
import { PrismaOrderRepository } from "../orders/order.repository";
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
  dispatcher = new QueueNotificationDispatcher(getJobQueue());
  return dispatcher;
}

/** Bildirim servisi tekil örneği; domain olay dinleyicileri ilk başlatmada bağlanır. */
export function getNotificationService(): NotificationService {
  if (notifications) return notifications;

  notifications = new NotificationService(
    new PrismaOrderRepository(getDb),
    getNotificationDispatcher(),
    {
      siteName: siteConfig.name,
      baseUrl: getSiteUrl(),
    },
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
