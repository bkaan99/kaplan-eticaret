import {
  sendNetgsmSms,
  type SmsMessage,
} from "@/integrations/notification/netgsm-sms";
import { JOB_SEND_SMS } from "@/modules/notifications/handlers/sms-notification.handler";
import { getEnv } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { JobQueue } from "@/shared/queue";

/** SMS işlerini Netgsm ile gönderir (yerel worker). Ayar yoksa SMS loglanıp atlanır. */
export async function registerSmsJobs(queue: JobQueue): Promise<void> {
  const env = getEnv();

  await queue.process<SmsMessage>(JOB_SEND_SMS, async (message) => {
    if (!env.NETGSM_USERCODE || !env.NETGSM_PASSWORD || !env.NETGSM_MSGHEADER) {
      logger.warn({ to: message.to }, "Netgsm ayarı yok; SMS gönderilmedi");
      return;
    }
    await sendNetgsmSms(
      {
        usercode: env.NETGSM_USERCODE,
        password: env.NETGSM_PASSWORD,
        msgheader: env.NETGSM_MSGHEADER,
      },
      message,
    );
    logger.info({ to: message.to }, "SMS gönderildi");
  });
}
