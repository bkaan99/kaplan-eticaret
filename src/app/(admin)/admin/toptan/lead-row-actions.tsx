"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WholesaleLeadStatus } from "@/modules/wholesale/wholesale.types";
import { updateWholesaleLeadStatusAction } from "./actions";

export function LeadRowActions({
  id,
  status,
}: {
  id: string;
  status: WholesaleLeadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function setStatus(next: WholesaleLeadStatus) {
    startTransition(async () => {
      const result = await updateWholesaleLeadStatusAction(id, next, note);
      setError(result.ok ? null : (result.error ?? "İşlem başarısız"));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {status === "NEW" ? (
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => setStatus("CONTACTED")}
          >
            Görüşüldü olarak işaretle
          </Button>
        ) : null}
        {status !== "CLOSED" ? (
          <>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Personel notu (isteğe bağlı)"
              className="w-full sm:w-64"
              aria-label="Personel notu"
            />
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => setStatus("CLOSED")}
            >
              Kapat
            </Button>
          </>
        ) : null}
        {status === "CLOSED" ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => setStatus("NEW")}
          >
            Yeniden aç
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
