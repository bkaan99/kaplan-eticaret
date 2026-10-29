import type { EmailMessage } from "@/integrations/notification/mailer";
import type { JobQueue } from "@/shared/queue";
import type { RenderedEmail } from "./templates/layout";

export const JOB_SEND_EMAIL = "email.send";
export const DEFAULT_EMAIL_RETRY_LIMIT = 5;

/** E-posta ve bildirimlerin kuyruğa iletilmesini sağlayan genel dağıtıcı arayüzü. */
export interface NotificationDispatcher {
  dispatch(to: string, email: RenderedEmail): Promise<void>;
}

/** JobQueue kullanarak e-postaları asenkron kuyruğa atan somut dağıtıcı. */
export class QueueNotificationDispatcher implements NotificationDispatcher {
  constructor(
    private readonly queue: JobQueue,
    private readonly retryLimit: number = DEFAULT_EMAIL_RETRY_LIMIT,
  ) {}

  async dispatch(to: string, email: RenderedEmail): Promise<void> {
    const message: EmailMessage = { to, ...email };
    await this.queue.enqueue(JOB_SEND_EMAIL, message, {
      retryLimit: this.retryLimit,
    });
  }
}
