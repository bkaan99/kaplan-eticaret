import "server-only";

/** Workers binding'lerine erişim. Node/dev'de null. */
export function getCloudflareEnv(): CloudflareEnv | null {
  try {
    // Dinamik import yerine sync require: getDb() senkron kalmalı.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@opennextjs/cloudflare") as {
      getCloudflareContext?: () => { env?: CloudflareEnv };
    };
    const ctx = mod.getCloudflareContext?.();
    return ctx?.env ?? null;
  } catch {
    return null;
  }
}
