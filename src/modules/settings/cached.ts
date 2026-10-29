import { unstable_cache } from "next/cache";
import { settingsService } from "./container";
import type { ContactSettings } from "./settings.types";

export const getCachedContactSettings: () => Promise<ContactSettings> =
  unstable_cache(
    () => settingsService.getContactSettings(),
    ["contact_settings_cache"],
    { revalidate: 300, tags: ["settings", "contact_settings"] },
  );
