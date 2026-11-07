/** Misafir sipariş erişim linki (e-posta / SMS / ödeme dönüşü). */
export function orderAccessPath(
  orderNumber: string,
  token: string,
  extra: Record<string, string> = {},
): string {
  const query = new URLSearchParams({ t: token, ...extra });
  return `/siparis/${orderNumber}/erisim?${query.toString()}`;
}

export function orderAccessUrl(
  baseUrl: string,
  orderNumber: string,
  token: string,
  extra: Record<string, string> = {},
): string {
  return `${baseUrl.replace(/\/$/, "")}${orderAccessPath(orderNumber, token, extra)}`;
}

/** Yalnızca site içi göreli yollar (open redirect yok). */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
