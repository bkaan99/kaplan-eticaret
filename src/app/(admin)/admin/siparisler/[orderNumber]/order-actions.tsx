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

  function PrimaryButtons() {
    return (
      <>
        {canConfirmBankTransfer ? (
          <Button
            className="w-full sm:w-auto"
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
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => run(() => markProcessingAction(orderNumber))}
          >
            Hazırlanıyor
          </Button>
        ) : null}
        {canDeliver ? (
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => run(() => markDeliveredAction(orderNumber))}
          >
            Teslim edildi
          </Button>
        ) : null}
        {canCollectDeferred ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
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
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {hasPrimary ? (
          <div className="hidden flex-col gap-2 sm:flex-row sm:flex-wrap md:flex">
            <PrimaryButtons />
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
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={pending}
              >
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
          <div className="hidden flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 md:flex">
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

      {hasPrimary || canCancel ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-md md:hidden">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Sipariş işlemleri
          </p>
          {hasPrimary ? (
            <div className="flex flex-col gap-2">
              <PrimaryButtons />
            </div>
          ) : null}
          {canCancel ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={cancel}
              className={`w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 ${hasPrimary ? "mt-2" : ""}`}
            >
              Siparişi iptal et
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
