import { logger } from "../logger";
import type { EnqueueOptions, JobHandler, JobQueue } from "./job-queue";

type Pending = { name: string; data: object };

/**
 * Yerel geliştirme kuyruğu: handler kayıtlıysa işi hemen çalıştırır.
 * Ayrı worker process olmadan e-posta gönderilebilir.
 */
export class InlineJobQueue implements JobQueue {
  private readonly handlers = new Map<string, JobHandler<object>>();
  private readonly pending: Pending[] = [];

  async enqueue<T extends object>(
    name: string,
    data: T,
    _options: EnqueueOptions = {},
  ): Promise<string | null> {
    const handler = this.handlers.get(name);
    if (handler) {
      try {
        await handler(data);
      } catch (error) {
        logger.error({ err: error, name }, "Inline kuyruk işi başarısız");
        throw error;
      }
      return `inline:${name}`;
    }

    this.pending.push({ name, data });
    return `queued:${name}`;
  }

  async process<T extends object>(
    name: string,
    handler: JobHandler<T>,
  ): Promise<void> {
    this.handlers.set(name, handler as JobHandler<object>);
    const rest: Pending[] = [];
    for (const job of this.pending) {
      if (job.name !== name) {
        rest.push(job);
        continue;
      }
      await handler(job.data as T);
    }
    this.pending.length = 0;
    this.pending.push(...rest);
  }

  async schedule(name: string, cron: string): Promise<void> {
    logger.info(
      { name, cron },
      "Inline kuyrukta schedule yok; /api/cron/* veya Cloudflare Cron kullanın",
    );
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async stop(): Promise<void> {
    this.handlers.clear();
    this.pending.length = 0;
  }
}
