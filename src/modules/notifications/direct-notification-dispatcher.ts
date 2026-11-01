import type { EmailMessage } from "@/integrations/notification/mailer";
import type { Mailer } from "@/integrations/notification/mailer";
import type { RenderedEmail } from "./templates/layout";
import type { NotificationDispatcher } from "./notification-dispatcher";

/** Yerel geliştirmede SMTP'ye doğrudan gönderir (kuyruk yok). */
export class DirectNotificationDispatcher implements NotificationDispatcher {
  constructor(private readonly mailer: Mailer) {}

  async dispatch(to: string, email: RenderedEmail): Promise<void> {
    const message: EmailMessage = { to, ...email };
    await this.mailer.send(message);
  }
}
