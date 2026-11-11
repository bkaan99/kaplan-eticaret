import { STOREFRONT_PROCESS_TTL_MS } from "@/config/cache-policy";
import { TtlCache } from "./ttl-cache";

const caches = new Set<{ invalidate(): void }>();

/** Vitrin okuma önbelleği oluşturur ve toplu temizleme için kaydeder. */
export function createStorefrontCache<K, V>(
  loader: (key: K) => Promise<V>,
  ttlMs = STOREFRONT_PROCESS_TTL_MS,
): TtlCache<K, V> {
  const cache = new TtlCache(loader, ttlMs);
  caches.add(cache);
  return cache;
}

/** Yönetim panelinde bir değişiklik yapıldığında çağrılır. */
export function invalidateStorefrontCaches(): void {
  for (const cache of caches) cache.invalidate();
}

/** Tek değerli (anahtarsız) vitrin önbelleği. */
export function createSingleStorefrontCache<V>(
  loader: () => Promise<V>,
  ttlMs = STOREFRONT_PROCESS_TTL_MS,
): { get(): Promise<V> } {
  const cache = createStorefrontCache<"value", V>(() => loader(), ttlMs);
  return { get: () => cache.get("value") };
}
