"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  PAYMENT_MODE_LABELS,
  type PaymentMode,
} from "@/integrations/payment/payment-mode";
import { cn } from "@/shared/cn";
import { savePaymentModeAction } from "./actions";

const OPTIONS: {
  mode: PaymentMode;
  description: string;
  needsPaytr: boolean;
}[] = [
  {
    mode: "FAKE",
    description:
      "Müşteri kartla ödemeyi seçince sahte bir ödeme sayfasına gider ve “başarılı” diyebilir. Gerçek para alınmaz, PayTR anahtarı gerekmez. Deneme ve eğitim içindir; ödeme sayfasında ve ödeme adımında “Test modu” uyarısı görünür.",
    needsPaytr: false,
  },
  {
    mode: "PAYTR_TEST",
    description:
      "Gerçek PayTR ödeme sayfası açılır ama PayTR’nin test (sandbox) modunda çalışır; kartlardan para çekilmez. Canlıya geçmeden önce PayTR bağlantısını denemek içindir.",
    needsPaytr: true,
  },
  {
    mode: "LIVE",
    description:
      "Müşterilerden PayTR üzerinden gerçek ödeme alınır. Sadece siteyi satışa açmaya hazırsanız seçin.",
    needsPaytr: true,
  },
];

function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "slate";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-800",
        tone === "slate" && "bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}

export function PaymentModeForm({
  currentMode,
  paytrConfigured,
  callbackUrl,
}: {
  currentMode: PaymentMode;
  paytrConfigured: boolean;
  callbackUrl: string;
}) {
  const [saved, setSaved] = useState<PaymentMode>(currentMode);
  const [selected, setSelected] = useState<PaymentMode>(currentMode);
  const [confirmLive, setConfirmLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = selected !== saved;
  const needsConfirm = selected === "LIVE" && dirty;
  const canSave = dirty && (!needsConfirm || confirmLive) && !pending;

  function save() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await savePaymentModeAction(selected);
      if (!result.ok) {
        setError(result.error ?? "Ödeme modu kaydedilemedi");
        return;
      }
      setSaved(selected);
      setConfirmLive(false);
      setNotice(`Ödeme modu güncellendi: ${PAYMENT_MODE_LABELS[selected]}.`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
          saved === "LIVE"
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50",
        )}
      >
        <span className="text-[13px] font-semibold text-slate-900">
          Şu an: {PAYMENT_MODE_LABELS[saved]}
        </span>
        <span className="text-[12px] text-slate-600">
          {saved === "LIVE"
            ? "Müşterilerden gerçek ödeme alınıyor."
            : saved === "PAYTR_TEST"
              ? "PayTR sandbox: gerçek para çekilmiyor."
              : "Gerçek ödeme alınmıyor; müşteriler sahte ödeme sayfasını görüyor."}
        </span>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-900">
              Ödeme modu
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Değişiklik birkaç saniye içinde tüm ziyaretçilere yansır.
            </p>
          </div>
          <Badge tone={paytrConfigured ? "green" : "amber"}>
            PayTR anahtarları: {paytrConfigured ? "tanımlı" : "tanımlı değil"}
          </Badge>
        </header>

        <div className="space-y-3 p-4 sm:p-5">
          {OPTIONS.map((option) => {
            const disabled = option.needsPaytr && !paytrConfigured;
            const active = selected === option.mode;
            return (
              <label
                key={option.mode}
                className={cn(
                  "flex gap-3 rounded-xl border p-3.5 transition-colors",
                  active
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                )}
              >
                <input
                  type="radio"
                  name="payment-mode"
                  value={option.mode}
                  checked={active}
                  disabled={disabled}
                  onChange={() => {
                    setSelected(option.mode);
                    setConfirmLive(false);
                    setError(null);
                    setNotice(null);
                  }}
                  className="mt-1"
                />
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-900">
                    {PAYMENT_MODE_LABELS[option.mode]}
                    {saved === option.mode ? (
                      <Badge tone="slate">Aktif</Badge>
                    ) : null}
                  </span>
                  <span className="text-[12px] leading-relaxed text-slate-600">
                    {option.description}
                  </span>
                  {disabled ? (
                    <span className="text-[12px] font-medium text-amber-800">
                      Seçmek için önce PayTR anahtarları eklenmeli.
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}

          {needsConfirm ? (
            <label className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[12px] text-red-900">
              <input
                type="checkbox"
                checked={confirmLive}
                onChange={(event) => setConfirmLive(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong>Canlıya alıyorum.</strong> Bu andan itibaren
                müşterilerin kartlarından gerçek tahsilat yapılır. Sahte ödeme
                sayfası kapanır; bekleyen test siparişleri ödenemez.
              </span>
            </label>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800"
            >
              {notice}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            {dirty ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSelected(saved);
                  setConfirmLive(false);
                  setError(null);
                }}
              >
                Vazgeç
              </Button>
            ) : null}
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={save}
              disabled={!canSave}
            >
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <header className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <h2 className="text-[13px] font-semibold text-slate-900">
            PayTR bağlantısı
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            PayTR anahtarları güvenlik için bu panelden girilmez; yalnızca
            Cloudflare’de gizli anahtar olarak tanımlanır.
          </p>
        </header>
        <div className="space-y-3 p-4 text-[12px] text-slate-600 sm:p-5">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Cloudflare’de <code>PAYTR_MERCHANT_ID</code>,{" "}
              <code>PAYTR_MERCHANT_KEY</code> ve{" "}
              <code>PAYTR_MERCHANT_SALT</code> gizli anahtarlarını ekleyin
              (bilgi işlem/geliştirici yapar).
            </li>
            <li>
              PayTR mağaza panelinde “Bildirim URL” alanına aşağıdaki adresi
              yazın.
            </li>
            <li>
              Önce <strong>PayTR test</strong> ile bir deneme siparişi verin,
              sonra <strong>Canlı</strong>’ya geçin.
            </li>
          </ol>
          <div className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] break-all text-slate-700">
            {callbackUrl}
          </div>
        </div>
      </section>
    </div>
  );
}
