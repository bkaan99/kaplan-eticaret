import type { StockAlertMailer } from "../../stock-alerts/stock-alert.service";
import type { NotificationDispatcher } from "../notification-dispatcher";
import {
  renderStockAvailable,
  type EmailContext,
} from "../templates/order-emails";

export interface StockAlertNotificationHandlerDeps {
  dispatcher: NotificationDispatcher;
  context: EmailContext;
}

/** Stok gelince haber ver abonelerine bildirim e-postasını hazırlar ve dağıtıcıya iletir. */
export class StockAlertNotificationHandler implements StockAlertMailer {
  constructor(private readonly deps: StockAlertNotificationHandlerDeps) {}

  async sendStockAvailable(
    email: string,
    product: { name: string; slug: string },
    unsubscribeUrl: string,
  ): Promise<void> {
    await this.deps.dispatcher.dispatch(
      email,
      renderStockAvailable(product, this.deps.context, unsubscribeUrl),
    );
  }
}
