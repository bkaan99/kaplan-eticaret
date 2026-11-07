import type {
  ExportedHandler,
  MessageBatch,
  ScheduledController,
} from "@cloudflare/workers-types";

// OpenNext build çıktısındaki fetch handler'ı yeniden kullanır;
// Queue consumer + Cron Trigger ekler.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — `.open-next/worker.js` build sırasında üretilir; build öncesi tip denetimi de geçsin
import { default as handler } from "../.open-next/worker.js";
import {
  normalizeTrMobile,
  sendNetgsmSms,
} from "../src/integrations/notification/netgsm-sms";

type JobBody = {
  name?: string;
  data?: unknown;
  retryLimit?: number;
};

type SmsPayload = { to?: string; text?: string };

type EmailPayload = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

async function callCron(env: CloudflareEnv, path: string): Promise<void> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    throw new Error(`CRON_SECRET tanımlı değil; cron çalıştırılamaz: ${path}`);
  }

  const base = env.APP_URL ?? "https://kaplan-eticaret.workers.dev";
  const headers: Record<string, string> = {
    authorization: `Bearer ${secret}`,
  };

  // Kendine servis bağlaması: istek internete/Access'e çıkmaz, aynı hesaptaki Worker
  // çağrısı hatasına (1042) takılmaz ve Service Token gerektirmez.
  let res: { ok: boolean; status: number; text(): Promise<string> };
  if (env.WORKER_SELF_REFERENCE) {
    res = await env.WORKER_SELF_REFERENCE.fetch(`${base}${path}`, { headers });
  } else {
    // Bağlama yoksa (ör. yerel deneme) herkese açık adrese gidilir; Access açıksa Service Token ile geçer.
    if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
      headers["CF-Access-Client-Id"] = env.CF_ACCESS_CLIENT_ID;
      headers["CF-Access-Client-Secret"] = env.CF_ACCESS_CLIENT_SECRET;
    }
    res = await fetch(`${base}${path}`, { headers });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cron ${path} başarısız: ${res.status} ${text}`);
  }
}

async function sendEmailViaResend(
  env: CloudflareEnv,
  payload: EmailPayload,
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY tanımlı değil");
  }
  if (!payload.to || !payload.subject || !payload.html || !payload.text) {
    throw new Error("email.send gövdesi eksik (to/subject/html/text)");
  }

  const from = env.MAIL_FROM ?? "Kaplan Turşu <no-reply@kaplantursu.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 500)}`);
  }
}

const worker: ExportedHandler<CloudflareEnv> = {
  fetch: handler.fetch,

  async queue(batch: MessageBatch, env: CloudflareEnv): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body as JobBody;
      const name = body?.name;
      if (!name) {
        message.ack();
        continue;
      }

      if (name === "email.send") {
        const payload = (body.data ?? {}) as EmailPayload;
        if (!env.RESEND_API_KEY) {
          // Secret yokken kuyruğu zehirleme; staging'de log + ack.
          console.warn("RESEND_API_KEY yok; email.send atlandı", {
            to: payload.to,
          });
          message.ack();
          continue;
        }
        try {
          await sendEmailViaResend(env, payload);
          console.log("email.send gönderildi", { to: payload.to });
          message.ack();
        } catch (error) {
          console.error("email.send başarısız; yeniden denenecek", error);
          message.retry();
        }
        continue;
      }

      if (name === "sms.send") {
        const payload = (body.data ?? {}) as SmsPayload;
        const to = normalizeTrMobile(payload.to);
        if (
          !env.NETGSM_USERCODE ||
          !env.NETGSM_PASSWORD ||
          !env.NETGSM_MSGHEADER ||
          !to ||
          !payload.text
        ) {
          // Ayar veya numara eksikken kuyruğu zehirleme; log + ack.
          console.warn(
            "Netgsm ayarı ya da SMS gövdesi eksik; sms.send atlandı",
            {
              hasConfig: Boolean(env.NETGSM_USERCODE && env.NETGSM_PASSWORD),
            },
          );
          message.ack();
          continue;
        }
        try {
          await sendNetgsmSms(
            {
              usercode: env.NETGSM_USERCODE,
              password: env.NETGSM_PASSWORD,
              msgheader: env.NETGSM_MSGHEADER,
            },
            { to, text: payload.text },
          );
          console.log("sms.send gönderildi");
          message.ack();
        } catch (error) {
          console.error("sms.send başarısız; yeniden denenecek", error);
          message.retry();
        }
        continue;
      }

      console.warn("Bilinmeyen kuyruk işi", name);
      message.ack();
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
  ): Promise<void> {
    switch (controller.cron) {
      case "*/5 * * * *":
        await callCron(env, "/api/cron/release-expired");
        break;
      case "0 * * * *":
        await callCron(env, "/api/cron/purge-rate-limits");
        break;
      case "30 3 * * *": {
        const results = await Promise.allSettled([
          callCron(env, "/api/cron/purge-audit-log"),
          callCron(env, "/api/cron/purge-abandoned-carts"),
        ]);
        for (const res of results) {
          if (res.status === "rejected") {
            console.error("Gece bakım cronu hatası:", res.reason);
          }
        }
        break;
      }
      case "0 4 * * *":
        await callCron(env, "/api/cron/purge-abandoned-carts");
        break;
      default:
        console.warn("Tanımsız cron", controller.cron);
    }
  },
};

export default worker;

// OpenNext cache DO'ları (kullanılıyorsa)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — build çıktısı
export { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";
