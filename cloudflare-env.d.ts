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
    /** Kendine servis bağlaması: cron ve OpenNext self-call'ları bunun üzerinden gider. */
    WORKER_SELF_REFERENCE?: Fetcher;
    /** Cron HTTP Bearer; wrangler secret */
    CRON_SECRET?: string;
    /** Self-fetch tabanı; örn. https://kaplan-eticaret.<subdomain>.workers.dev */
    APP_URL?: string;
    /** Turnstile (site key vars'ta, secret wrangler secret) */
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    /** Access Service Token — staging Access açıkken cron self-fetch için */
    CF_ACCESS_CLIENT_ID?: string;
    CF_ACCESS_CLIENT_SECRET?: string;
  }
}

export {};
