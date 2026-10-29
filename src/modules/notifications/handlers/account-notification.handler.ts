import type { AccountMailer } from "../../account/account.service";
import type { NotificationDispatcher } from "../notification-dispatcher";
import {
  renderEmailVerification,
  renderPasswordReset,
} from "../templates/account-emails";

export interface AccountNotificationHandlerDeps {
  dispatcher: NotificationDispatcher;
  siteName: string;
}

/** Hesap doğrulama ve şifre sıfırlama e-postalarını hazırlar ve dağıtıcıya iletir. */
export class AccountNotificationHandler implements AccountMailer {
  constructor(private readonly deps: AccountNotificationHandlerDeps) {}

  async sendEmailVerification(email: string, link: string): Promise<void> {
    await this.deps.dispatcher.dispatch(
      email,
      renderEmailVerification(link, { siteName: this.deps.siteName }),
    );
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.deps.dispatcher.dispatch(
      email,
      renderPasswordReset(link, { siteName: this.deps.siteName }),
    );
  }
}
