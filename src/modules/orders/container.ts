import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { getSiteUrl } from "@/shared/site-url";
import {
  getDevPaymentProvider,
  getPaymentProvider,
} from "@/integrations/payment/container";
import { getNotificationService } from "../notifications/container";
import { PrismaOrderRepository } from "./order.repository";
import { OrderService } from "./order.service";
import { PaymentService } from "./payment.service";

// Geriye dönük uyumluluk için payment provider re-export'ları:
export { getDevPaymentProvider, getPaymentProvider };

export const orderRepository = new PrismaOrderRepository(getDb);

export function getPaymentService(): PaymentService {
  getNotificationService();
  return new PaymentService(
    getPaymentProvider(),
    orderRepository,
    getEventBus(),
    { baseUrl: getSiteUrl() },
  );
}

export function getOrderService(): OrderService {
  getNotificationService();
  return new OrderService(orderRepository, getPaymentProvider(), getEventBus());
}
