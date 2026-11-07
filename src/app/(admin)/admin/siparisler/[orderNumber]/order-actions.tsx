"use client";

import { CARRIER_NAMES } from "@/shared/shipping/carriers";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  cancelOrderByStaffAction,
  confirmBankTransferAction,
  markDeferredCollectedAction,
  markDeliveredAction,
  markProcessingAction,
  shipOrderAction,
} from "../actions";

export function OrderActions({
  orderNumber,
  canProcess,
  canShip,
  canDeliver,
  canCancel,
  canConfirmBankTransfer,
  canCollectDeferred,
  paid,
}: {
  orderNumber: string;
  canProcess: boolean;
  canShip: boolean;
  canDeliver: boolean;
  canCancel: boolean;
  canConfirmBankTransfer: boolean;
  canCollectDeferred: boolean;
  paid: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      setError(result.ok ? null : (result.error ?? "İşlem başarısız"));
    });
  }

  function cancel() {
    const message = paid
      ? "Sipariş iptal edilsin ve ödeme müşteriye iade edilsin mi?"
      : "Sipariş iptal edilsin mi?";
    if (window.confirm(message))
      run(() => cancelOrderByStaffAction(orderNumber));
  }

  const hasPrimary =
    canProcess || canConfirmBankTransfer || canCollectDeferred || canDeliver;

  if (!hasPrimary && !canShip && !canCancel) {
    return (
      <p className="text-[12px] text-slate-500">
        Bu sipariş için yapılacak bir işlem kalmadı.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasPrimary ? (
        <div className="flex flex-wrap gap-2">
          {canConfirmBankTransfer ? (
            <Button
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    "Havale/EFT hesaba geçti mi? Sipariş ödenmiş sayılacak.",
                  )
                ) {
                  run(() => confirmBankTransferAction(orderNumber));
                }
              }}
            >
              Havale alındı
            </Button>
          ) : null}
          {canProcess ? (
            <Button
              disabled={pending}
              onClick={() => run(() => markProcessingAction(orderNumber))}
            >
              Hazırlanıyor olarak işaretle
            </Button>
          ) : null}
          {canDeliver ? (
            <Button
              disabled={pending}
              onClick={() => run(() => markDeliveredAction(orderNumber))}
            >
              Teslim edildi olarak işaretle
            </Button>
          ) : null}
          {canCollectDeferred ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    "Vadeli ödeme tahsil edildi olarak işaretlensin mi?",
                  )
                ) {
                  run(() => markDeferredCollectedAction(orderNumber));
                }
              }}
            >
              Tahsil edildi
            </Button>
          ) : null}
        </div>
      ) : null}

      {canShip ? (
        <form
          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
          action={(formData) =>
            run(() =>
              shipOrderAction(
                orderNumber,
                String(formData.get("carrier") ?? ""),
                String(formData.get("trackingNumber") ?? ""),
              ),
            )
          }
        >
          <p className="text-[12px] font-semibold text-slate-800">
            Kargoya ver
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Müşteriye takip bilgisiyle e-posta gönderilir.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-end">
            <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
              Kargo firması
              <Select name="carrier" defaultValue={CARRIER_NAMES[0]}>
                {CARRIER_NAMES.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
              Takip numarası
              <Input name="trackingNumber" placeholder="Örn. 1234567890" />
            </label>
            <Button type="submit" disabled={pending}>
              Kargoya ver
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800"
        >
          {error}
        </p>
      ) : null}

      {canCancel ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] text-slate-500">
            {paid
              ? "İptal edilirse ödeme müşteriye iade edilir; geri alınamaz."
              : "İptal işlemi geri alınamaz."}
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={cancel}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            Siparişi iptal et
          </Button>
        </div>
      ) : null}
    </div>
  );
}
