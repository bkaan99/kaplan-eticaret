import type { Queue } from "@cloudflare/workers-types";
import type { EnqueueOptions, JobHandler, JobQueue } from "./job-queue";

type JobMessage = {
  name: string;
  data: object;
  retryLimit?: number;
};

/**
 * Cloudflare Queues üreticisi.
 * `process` / `schedule` Workers consumer + Cron Trigger tarafında bağlanır;
 * web sürecinde yalnızca enqueue kullanılır.
 */
export class CloudflareJobQueue implements JobQueue {
  private readonly handlers = new Map<string, JobHandler<object>>();

  constructor(private readonly queue: Queue) {}

  async enqueue<T extends object>(
    name: string,
    data: T,
    options: EnqueueOptions = {},
  ): Promise<string | null> {
    const body: JobMessage = {
      name,
      data,
      ...(options.retryLimit !== undefined
        ? { retryLimit: options.retryLimit }
        : {}),
    };
    await this.queue.send(body, {
      delaySeconds: options.delaySeconds,
    });
    return null;
  }

  async process<T extends object>(
    name: string,
    handler: JobHandler<T>,
  ): Promise<void> {
    this.handlers.set(name, handler as JobHandler<object>);
  }

  async schedule(_name: string, _cron: string): Promise<void> {
    // Zamanlama wrangler.jsonc `triggers.crons` + worker cron handler ile yapılır.
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async stop(): Promise<void> {
    this.handlers.clear();
  }

  /** Queue consumer Worker bu metodu çağırır. */
  async handleMessage(message: JobMessage): Promise<void> {
    const handler = this.handlers.get(message.name);
    if (!handler) {
      throw new Error(`Kayıtlı işleyici yok: ${message.name}`);
    }
    await handler(message.data);
  }

  getHandler(name: string): JobHandler<object> | undefined {
    return this.handlers.get(name);
  }
}
