import { siteConfig } from "@/config/site.config";
import type { ReturnNotifier } from "../../returns/return.service";
import type { NotificationDispatcher } from "../notification-dispatcher";
import type { EmailContext } from "../templates/order-emails";
import { renderReturnDecision } from "../templates/return-emails";

export interface ReturnNotificationHandlerDeps {
  dispatcher: NotificationDispatcher;
  context: EmailContext;
  currency?: string;
}

/** Ürün iade karar bildirimlerini hazırlar ve dağıtıcıya iletir. */
export class ReturnNotificationHandler implements ReturnNotifier {
  constructor(private readonly deps: ReturnNotificationHandlerDeps) {}

  async onReturnDecided(info: {
    email: string;
    orderNumber: string;
    approved: boolean;
    amount: string | null;
    note: string | null;
  }): Promise<void> {
    await this.deps.dispatcher.dispatch(
      info.email,
      renderReturnDecision(
        {
          orderNumber: info.orderNumber,
          approved: info.approved,
          amount: info.amount,
          currency: this.deps.currency ?? siteConfig.currency,
          note: info.note,
        },
        this.deps.context,
      ),
    );
  }
}
