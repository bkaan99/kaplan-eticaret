import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Workers binding'lerine erişim. Node/dev'de null. */
export function getCloudflareEnv(): CloudflareEnv | null {
  try {
    const { env } = getCloudflareContext();
    return env ?? null;
  } catch {
    return null;
  }
}

/** SSG / async bağlamlar için. */
export async function getCloudflareEnvAsync(): Promise<CloudflareEnv | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env ?? null;
  } catch {
    return null;
  }
}
