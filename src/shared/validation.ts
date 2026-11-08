/** Zod hatasındaki ilk mesajı döndürür (kullanıcıya gösterilecek tek satır). */
export function firstIssue(error: {
  issues: readonly { message: string }[];
}): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}

/**
 * Zod sorunlarını "variants.0.sku" biçiminde alan yoluna çevirir; aynı alanda ilk mesaj korunur.
 * `mapPart` ile yol parçaları yeniden adlandırılabilir.
 */
export function toFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
  mapPart: (part: PropertyKey) => string = String,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(mapPart).join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
