import type {
  D1Database,
  Fetcher,
  Queue,
  R2Bucket,
} from "@cloudflare/workers-types";

/** Wrangler `cf-typegen` ile güncellenir; elle tutulan iskelet. */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    UPLOADS: R2Bucket;
    NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
    JOB_QUEUE: Queue;
    ASSETS?: Fetcher;
  }
}

export {};
