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

type JobBody = {
  name?: string;
  data?: unknown;
  retryLimit?: number;
};

async function callCron(env: CloudflareEnv, path: string): Promise<void> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    console.warn("CRON_SECRET yok; cron atlandı", path);
    return;
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

const worker: ExportedHandler<CloudflareEnv> = {
  fetch: handler.fetch,

  async queue(batch: MessageBatch, _env: CloudflareEnv): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body as JobBody;
      const name = body?.name;
      if (!name) {
        message.ack();
        continue;
      }

      if (name === "email.send") {
        console.log("email.send kuyruk mesajı alındı", {
          to: (body.data as { to?: string } | undefined)?.to,
        });
        // TODO: Resend / Email Sending adapter
        message.ack();
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
      case "30 3 * * *":
        await callCron(env, "/api/cron/purge-audit-log");
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
