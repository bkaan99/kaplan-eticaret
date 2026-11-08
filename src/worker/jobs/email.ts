import type { EmailMessage } from "@/integrations/notification/mailer";
import { createMailerFromEnv } from "@/integrations/notification/mailer-factory";
import { JOB_SEND_EMAIL } from "@/modules/notifications/notification.service";
import { logger } from "@/shared/logger";
import type { JobQueue } from "@/shared/queue";

/** E-posta gönderim işlerini SMTP üzerinden işler; hata verirse kuyruk yeniden dener. */
export async function registerEmailJobs(queue: JobQueue): Promise<void> {
  const mailer = createMailerFromEnv();

  await queue.process<EmailMessage>(JOB_SEND_EMAIL, async (message) => {
    await mailer.send(message);
    logger.info(
      { to: message.to, subject: message.subject },
      "E-posta gönderildi",
    );
  });
}
