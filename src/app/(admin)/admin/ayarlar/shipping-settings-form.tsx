"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShippingSettings } from "@/modules/settings/settings.types";
import { formatMoney } from "@/shared/money";
import { saveShippingSettingsAction } from "./actions";

interface ShippingFormFields {
  freeShippingThreshold: string;
  flatRate: string;
}

function toFields(settings: ShippingSettings): ShippingFormFields {
  return {
    freeShippingThreshold: String(settings.freeShippingThreshold),
    flatRate: String(settings.flatRate),
  };
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  // TR: "49,9" / "1.234,56" → nokta ondalık
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

export function ShippingSettingsForm({
  initialSettings,
}: {
  initialSettings: ShippingSettings;
}) {
  const [baseline, setBaseline] = useState(initialSettings);
  const [form, setForm] = useState(() => toFields(initialSettings));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewThreshold =
    parseAmount(form.freeShippingThreshold) ?? baseline.freeShippingThreshold;
  const previewFlatRate = parseAmount(form.flatRate) ?? baseline.flatRate;

  const isDirty = useMemo(() => {
    const baselineFields = toFields(baseline);
    return (
      form.freeShippingThreshold !== baselineFields.freeShippingThreshold ||
      form.flatRate !== baselineFields.flatRate
    );
  }, [form, baseline]);

  function handleReset() {
    setForm(toFields(baseline));
    setError(null);
    setNotice(null);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const freeShippingThreshold = parseAmount(form.freeShippingThreshold);
    const flatRate = parseAmount(form.flatRate);
    if (freeShippingThreshold === null || flatRate === null) {
      setError("Kargo tutarlarını sayı olarak girin");
      return;
    }

    const payload = { freeShippingThreshold, flatRate };

    startTransition(async () => {
      const result = await saveShippingSettingsAction(payload);
      if (!result.ok) {
        setError(result.error ?? "Kargo kuralları kaydedilemedi");
        return;
      }
      setBaseline(payload);
      setForm(toFields(payload));
      setNotice(
        "Kargo kuralları güncellendi. Navbar ve ödeme hesabı bu eşiği kullanır.",
      );
    });
  }

  return (
    <form
      onSubmit={save}
      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs"
    >
      <header className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-900">
              Kargo kuralları
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Ücretsiz kargo eşiği navbar şeridinde, sepette ve ödeme adımındaki
              gerçek kargo hesabında kullanılır.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Navbar", "Sepet", "Ödeme", "Ürün sayfası"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {notice ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-800"
          >
            {notice}
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">
              Ücretsiz kargo eşiği (₺)
              <span className="text-red-500"> *</span>
            </label>
            <Input
              type="text"
              inputMode="decimal"
              required
              value={form.freeShippingThreshold}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  freeShippingThreshold: e.target.value,
                }))
              }
              placeholder="500"
              className="bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Bu tutar ve üzeri siparişlerde kargo 0 ₺ olur.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">
              Sabit kargo ücreti (₺)
              <span className="text-red-500"> *</span>
            </label>
            <Input
              type="text"
              inputMode="decimal"
              required
              value={form.flatRate}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  flatRate: e.target.value,
                }))
              }
              placeholder="49.9"
              className="bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Eşiğin altındaki siparişlere uygulanan ücret.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-[12px] text-slate-600">
          <p className="font-medium text-slate-800">Önizleme</p>
          <p className="mt-1">
            Navbar:{" "}
            <span className="font-semibold text-emerald-800">
              {formatMoney(previewThreshold)} ve üzeri siparişlerde kargo
              ücretsiz!
            </span>
          </p>
          <p className="mt-0.5">
            Altında: {formatMoney(previewFlatRate)} kargo ücreti
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-[12px] font-medium text-slate-500">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Kaydedilmemiş değişiklikler
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Güncel
              </span>
            )}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {isDirty ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={handleReset}
                disabled={pending}
              >
                Vazgeç
              </Button>
            ) : null}
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              disabled={pending || !isDirty}
            >
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
