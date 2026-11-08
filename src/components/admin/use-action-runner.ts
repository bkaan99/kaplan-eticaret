"use client";

import { useState, useTransition } from "react";

export type RunnerMessage = { text: string; error: boolean } | null;
type ActionResult = { ok: boolean; error?: string };

/**
 * Yönetim ekranlarındaki sunucu eylemlerini çalıştırır: bekleme durumu + sonuç mesajı.
 * `run(action)`, `run(action, "Başarı metni")`, `run(action, onDone)` veya `run(action, "metin", onDone)`.
 */
export function useActionRunner() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<RunnerMessage>(null);

  function run(
    action: () => Promise<ActionResult>,
    successOrDone?: string | (() => void),
    onDoneArg?: () => void,
  ) {
    const successText =
      typeof successOrDone === "string"
        ? successOrDone
        : "İşlem başarıyla kaydedildi.";
    const onDone =
      typeof successOrDone === "function" ? successOrDone : onDoneArg;

    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage(
        result.ok
          ? { text: successText, error: false }
          : {
              text: result.error ?? "İşlem sırasında bir hata oluştu.",
              error: true,
            },
      );
      if (result.ok) onDone?.();
    });
  }

  /** Yalnızca hata metni isteyen ekranlar için: başarıda boş, hatada metin. */
  const error = message?.error ? message.text : null;
  const setError = (text: string | null) =>
    setMessage(text ? { text, error: true } : null);

  return { pending, message, error, run, setMessage, setError };
}
