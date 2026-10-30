import type { DealerMailer } from "../../b2b/dealer.service";
import type { NotificationDispatcher } from "../notification-dispatcher";
import {
  renderDealerApplicationForAdmin,
  renderDealerDecision,
} from "../templates/dealer-emails";
import type { EmailContext } from "../templates/order-emails";

export interface DealerNotificationHandlerDeps {
  dispatcher: NotificationDispatcher;
  context: EmailContext;
  adminEmail: string;
}

/** B2B bayi başvuru ve karar bildirimlerini hazırlar ve dağıtıcıya iletir. */
export class DealerNotificationHandler implements DealerMailer {
  constructor(private readonly deps: DealerNotificationHandlerDeps) {}

  async sendDealerApplicationToAdmin(application: {
    companyName: string;
    taxNumber: string;
    email: string;
  }): Promise<void> {
    await this.deps.dispatcher.dispatch(
      this.deps.adminEmail,
      renderDealerApplicationForAdmin(application, this.deps.context),
    );
  }

  async sendDealerDecision(
    email: string,
    approved: boolean,
    note: string | null,
  ): Promise<void> {
    await this.deps.dispatcher.dispatch(
      email,
      renderDealerDecision(approved, note, this.deps.context),
    );
  }
}
