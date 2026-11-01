import "server-only";
import { getCloudflareEnv } from "../cloudflare";
import type { JobQueue } from "./job-queue";
import { CloudflareJobQueue } from "./cloudflare-job-queue";
import { InlineJobQueue } from "./inline-job-queue";

export type { JobQueue, JobHandler, EnqueueOptions } from "./job-queue";

const globalForQueue = globalThis as unknown as {
  jobQueue?: JobQueue;
  workerQueue?: JobQueue;
  sharedInline?: InlineJobQueue;
};

function getInlineQueue(): InlineJobQueue {
  globalForQueue.sharedInline ??= new InlineJobQueue();
  return globalForQueue.sharedInline;
}

/** Web sürecinin kuyruğu: yalnızca iş ekler (CF'de Queue, yerelde inline). */
export function getJobQueue(): JobQueue {
  if (globalForQueue.jobQueue) return globalForQueue.jobQueue;

  const cf = getCloudflareEnv();
  if (cf?.JOB_QUEUE) {
    globalForQueue.jobQueue = new CloudflareJobQueue(cf.JOB_QUEUE);
    return globalForQueue.jobQueue;
  }

  globalForQueue.jobQueue = getInlineQueue();
  return globalForQueue.jobQueue;
}

/** Worker sürecinin kuyruğu: işleyicileri kaydeder. */
export function getWorkerQueue(): JobQueue {
  if (globalForQueue.workerQueue) return globalForQueue.workerQueue;

  const cf = getCloudflareEnv();
  if (cf?.JOB_QUEUE) {
    globalForQueue.workerQueue = new CloudflareJobQueue(cf.JOB_QUEUE);
    return globalForQueue.workerQueue;
  }

  globalForQueue.workerQueue = getInlineQueue();
  return globalForQueue.workerQueue;
}
