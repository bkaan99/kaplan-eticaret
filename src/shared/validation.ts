/** Zod hatasındaki ilk mesajı döndürür (kullanıcıya gösterilecek tek satır). */
export function firstIssue(error: {
  issues: readonly { message: string }[];
}): string {
  return error.issues[0]?.message ?? "Geçersiz bilgi";
}
