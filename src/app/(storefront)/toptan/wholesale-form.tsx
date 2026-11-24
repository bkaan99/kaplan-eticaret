"use client";

import { useActionState, type ReactNode } from "react";
import { ArrowRightIcon } from "@/components/storefront/icons";
import {
  BUSINESS_TYPES,
  CONTACT_CHANNELS,
  ORDER_VOLUMES,
  sendWholesaleQuoteAction,
  type WholesaleFormState,
} from "./actions";

const initial: WholesaleFormState = {};

const fieldClass =
  "h-11 w-full rounded-2xl border bg-slate-50/60 px-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4";
const okField = "border-slate-200 focus:border-primary focus:ring-primary/10";
const errField = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";
const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-700";

export function WholesaleForm({ captcha }: { captcha?: ReactNode }) {
  const [state, formAction, pending] = useActionState(
    sendWholesaleQuoteAction,
    initial,
  );

  if (state.ok) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-emerald-950 sm:text-2xl">
          Talebiniz bize ulaştı
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-800">
          Ekibimiz en kısa sürede sizinle iletişime geçecektir. İş birliği ve
          toptan alım süreçlerinde size destek olmaktan memnuniyet duyarız.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 text-left">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="companyName" className={labelClass}>
          Ad - Soyad / Firma Adı <span className="text-rose-500">*</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          required
          autoComplete="organization"
          placeholder="Örn: Ahmet Yılmaz / Yılmaz Restoran"
          className={`${fieldClass} ${state.fieldErrors?.companyName ? errField : okField}`}
        />
        {state.fieldErrors?.companyName ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.companyName}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            E-posta Adresi <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ornek@mail.com"
            className={`${fieldClass} ${state.fieldErrors?.email ? errField : okField}`}
          />
          {state.fieldErrors?.email ? (
            <span className="text-xs text-rose-600">
              {state.fieldErrors.email}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={labelClass}>
            Telefon Numarası <span className="text-rose-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            className={`${fieldClass} ${state.fieldErrors?.phone ? errField : okField}`}
          />
          {state.fieldErrors?.phone ? (
            <span className="text-xs text-rose-600">
              {state.fieldErrors.phone}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className={labelClass}>
          Şehir / İlçe <span className="text-rose-500">*</span>
        </label>
        <input
          id="city"
          name="city"
          required
          autoComplete="address-level2"
          placeholder="Örn: Ankara / Çubuk"
          className={`${fieldClass} ${state.fieldErrors?.city ? errField : okField}`}
        />
        {state.fieldErrors?.city ? (
          <span className="text-xs text-rose-600">{state.fieldErrors.city}</span>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={labelClass}>
          İşletme Türü <span className="text-rose-500">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUSINESS_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="businessType"
                value={type}
                required
                className="size-4 accent-primary"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.businessType ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.businessType}
          </span>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={labelClass}>
          Planladığınız sipariş veya toptan alım miktarı nedir?{" "}
          <span className="text-rose-500">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ORDER_VOLUMES.map((volume) => (
            <label
              key={volume}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="orderVolume"
                value={volume}
                required
                className="size-4 accent-primary"
              />
              <span>{volume}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.orderVolume ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.orderVolume}
          </span>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="details" className={labelClass}>
          Ek bilgi / açıklama
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          placeholder="Talebinizle ilgili ek bilgi, özel şart veya açıklama…"
          className={`w-full rounded-2xl border bg-slate-50/60 p-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${state.fieldErrors?.details ? errField : okField}`}
        />
        {state.fieldErrors?.details ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.details}
          </span>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={labelClass}>
          Size hangi iletişim kanalı üzerinden dönüş yapmamızı istersiniz?{" "}
          <span className="text-rose-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_CHANNELS.map((channel) => (
            <label
              key={channel}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm text-slate-800 transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                name="contactChannels"
                value={channel}
                className="size-4 accent-primary"
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.contactChannels ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.contactChannels}
          </span>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className={labelClass}>
          Not
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Eklemek istediğiniz notlar…"
          className={`w-full rounded-2xl border bg-slate-50/60 p-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${state.fieldErrors?.note ? errField : okField}`}
        />
        {state.fieldErrors?.note ? (
          <span className="text-xs text-rose-600">{state.fieldErrors.note}</span>
        ) : null}
      </div>

      {captcha ? <div className="pt-1">{captcha}</div> : null}

      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-slate-400 sm:max-w-sm">
          Talebiniz ulaştıktan sonra ekibimiz en kısa sürede sizinle iletişime
          geçecektir.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Gönderiliyor…</span>
            </>
          ) : (
            <>
              <span>Teklif Talebini Gönder</span>
              <ArrowRightIcon width={16} height={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
