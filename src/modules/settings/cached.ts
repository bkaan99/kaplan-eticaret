import { unstable_cache } from "next/cache";
import { settingsService } from "./container";
import type { ContactSettings } from "./settings.types";

export const getCachedContactSettings: () => Promise<ContactSettings> =
  unstable_cache(
    () => settingsService.getContactSettings(),
    ["contact_settings_cache"],
    // OpenNext'te etiket önbelleği tanımlı değil: `revalidateTag` güvenilmez, bayatlık süreyle sınırlanır.
    { revalidate: 60, tags: ["settings", "contact_settings"] },
  );
