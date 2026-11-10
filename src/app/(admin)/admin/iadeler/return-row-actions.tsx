"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveReturnAction, rejectReturnAction } from "./actions";

export function ReturnRowActions({
  requestId,
  amount,
}: {
  requestId: string;
  amount: string;
}) {
  const [pending, startTransition] = useTransition();
  const [restock, setRestock] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function approve() {
    if (!window.confirm(`${amount} TL müşteriye iade edilsin mi?`)) return;
    startTransition(async () => {
      const result = await approveReturnAction(requestId, restock);
      setError(result.ok ? null : (result.error ?? "İşlem başarısız"));
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectReturnAction(requestId, note);
      setError(result.ok ? null : (result.error ?? "İşlem başarısız"));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-10 items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={restock}
          onChange={(event) => setRestock(event.target.checked)}
          className="size-4 rounded border-slate-300"
        />
        Ürünleri stoğa geri al
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={approve}
        >
          Onayla ve iade et
        </Button>
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Red nedeni (isteğe bağlı)"
          className="w-full sm:w-56"
          aria-label="Red nedeni"
        />
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={reject}
        >
          Reddet
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
