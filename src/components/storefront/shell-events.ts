/** Vitrin kabuğu (sepet/hesap) yenileme sinyali. */

export const STOREFRONT_SHELL_REFRESH = "kaplan:storefront-shell-refresh";

export function refreshStorefrontShell(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STOREFRONT_SHELL_REFRESH));
}
