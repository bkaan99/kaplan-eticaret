import { siteConfig } from "@/config/site.config";
import type { JobQueue } from "@/shared/queue";
import type { AccountMailer } from "../account/account.service";
import type { DealerMailer } from "../b2b/dealer.service";
import type { OrderLookupRepository } from "../orders/order.repository";
import type { ReturnNotifier } from "../returns/return.service";
import type { StockAlertMailer } from "../stock-alerts/stock-alert.service";
import { AccountNotificationHandler } from "./handlers/account-notification.handler";
import { DealerNotificationHandler } from "./handlers/dealer-notification.handler";
import { OrderNotificationHandler } from "./handlers/order-notification.handler";
import { ReturnNotificationHandler } from "./handlers/return-notification.handler";
import { StockAlertNotificationHandler } from "./handlers/stock-alert-notification.handler";
import {
  JOB_SEND_EMAIL,
  QueueNotificationDispatcher,
  type NotificationDispatcher,
} from "./notification-dispatcher";
import type {
  BankAccountInfo,
  EmailContext,
} from "./templates/order-emails";

export { JOB_SEND_EMAIL };

/**
 * Bildirim orkestratörü (Facade).
 * E-posta kuyruklama işini `NotificationDispatcher`'a, alanlara özgü şablon
 * ve tetikleyici mantığını ise odaklı domain handler'lara delege eder.
 */
export class NotificationService
  implements AccountMailer, DealerMailer, ReturnNotifier, StockAlertMailer
{
  private readonly dispatcher: NotificationDispatcher;
  private readonly orderHandler: OrderNotificationHandler;
  private readonly accountHandler: AccountNotificationHandler;
  private readonly dealerHandler: DealerNotificationHandler;
  private readonly returnHandler: ReturnNotificationHandler;
  private readonly stockAlertHandler: StockAlertNotificationHandler;

  constructor(
    orders: OrderLookupRepository,
    queueOrDispatcher: JobQueue | NotificationDispatcher,
    context: EmailContext,
    adminEmail: string = siteConfig.contact.email,
    bankAccounts: readonly BankAccountInfo[] = siteConfig.b2b.bankAccounts,
  ) {
    this.dispatcher =
      "dispatch" in queueOrDispatcher
        ? queueOrDispatcher
        : new QueueNotificationDispatcher(queueOrDispatcher);

    this.orderHandler = new OrderNotificationHandler({
      orders,
      dispatcher: this.dispatcher,
      context,
      adminEmail,
      bankAccounts,
    });

    this.accountHandler = new AccountNotificationHandler({
      dispatcher: this.dispatcher,
      siteName: context.siteName,
    });

    this.dealerHandler = new DealerNotificationHandler({
      dispatcher: this.dispatcher,
      context,
      adminEmail,
    });

    this.returnHandler = new ReturnNotificationHandler({
      dispatcher: this.dispatcher,
      context,
    });

    this.stockAlertHandler = new StockAlertNotificationHandler({
      dispatcher: this.dispatcher,
      context,
    });
  }

  getDispatcher(): NotificationDispatcher {
    return this.dispatcher;
  }

  async onOrderPaid(orderId: string): Promise<void> {
    return this.orderHandler.onOrderPaid(orderId);
  }

  async onOrderPlaced(
    orderId: string,
    method: "BANK_TRANSFER" | "DEFERRED",
  ): Promise<void> {
    return this.orderHandler.onOrderPlaced(orderId, method);
  }

  async onOrderCancelled(orderId: string, refunded: boolean): Promise<void> {
    return this.orderHandler.onOrderCancelled(orderId, refunded);
  }

  async onOrderShipped(orderId: string): Promise<void> {
    return this.orderHandler.onOrderShipped(orderId);
  }

  async onReturnDecided(info: {
    email: string;
    orderNumber: string;
    approved: boolean;
    amount: string | null;
    note: string | null;
  }): Promise<void> {
    return this.returnHandler.onReturnDecided(info);
  }

  async sendStockAvailable(
    email: string,
    product: { name: string; slug: string },
    unsubscribeUrl: string,
  ): Promise<void> {
    return this.stockAlertHandler.sendStockAvailable(
      email,
      product,
      unsubscribeUrl,
    );
  }

  async sendEmailVerification(email: string, link: string): Promise<void> {
    return this.accountHandler.sendEmailVerification(email, link);
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    return this.accountHandler.sendPasswordReset(email, link);
  }

  async sendDealerApplicationToAdmin(application: {
    companyName: string;
    taxNumber: string;
    email: string;
  }): Promise<void> {
    return this.dealerHandler.sendDealerApplicationToAdmin(application);
  }

  async sendDealerDecision(
    email: string,
    approved: boolean,
    note: string | null,
  ): Promise<void> {
    return this.dealerHandler.sendDealerDecision(email, approved, note);
  }
}
