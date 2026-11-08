/** Sorgu parametresi gibi serbest metnin izin verilen değerlerden biri olup olmadığını denetler. */
export function isOneOf<T extends string>(
  allowed: readonly T[],
  value: string | undefined,
): value is T {
  return allowed.includes(value as T);
}
