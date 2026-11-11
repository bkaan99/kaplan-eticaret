import { unstable_cache } from "next/cache";
import { SETTINGS_CACHE_REVALIDATE_SECONDS } from "@/config/cache-policy";
import type { ShippingConfig } from "@/modules/checkout/shipping";
import { settingsService } from "./container";
import type { ContactSettings, ShippingSettings } from "./settings.types";

export const getCachedContactSettings: () => Promise<ContactSettings> =
  unstable_cache(
    () => settingsService.getContactSettings(),
    ["contact_settings_cache"],
    // OpenNext'te etiket önbelleği zayıf: bayatlık süreyle sınırlanır.
    {
      revalidate: SETTINGS_CACHE_REVALIDATE_SECONDS,
      tags: ["settings", "contact_settings"],
    },
  );

export const getCachedShippingSettings: () => Promise<ShippingSettings> =
  unstable_cache(
    () => settingsService.getShippingSettings(),
    ["shipping_settings_cache"],
    {
      revalidate: SETTINGS_CACHE_REVALIDATE_SECONDS,
      tags: ["settings", "shipping_settings"],
    },
  );

/** Navbar / sepet / checkout aynı kargo kaynağını kullanır. */
export const getCachedShippingConfig: () => Promise<ShippingConfig> =
  unstable_cache(
    () => settingsService.getShippingConfig(),
    ["shipping_config_cache"],
    {
      revalidate: SETTINGS_CACHE_REVALIDATE_SECONDS,
      tags: ["settings", "shipping_settings"],
    },
  );
