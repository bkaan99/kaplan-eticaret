"use client";

import { useActionState, useState } from "react";
import { ArrowRightIcon } from "@/components/storefront/icons";
import { sendContactMessageAction, type ContactFormState } from "./actions";

const initial: ContactFormState = {};

const SUBJECT_OPTIONS = [
  "Siparişim ve Teslimat Hakkında",
  "Toptan Alım / Bayilik Talebi",
  "Ürünler ve Salamura Formülleri",
  "Kendi Turşunu Yap Özel Üretim",
  "Öneri, Teşekkür veya Şikayet",
  "Diğer Konular",
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessageAction,
    initial,
  );
  const [submitted, setSubmitted] = useState(false);

  if (state.ok && !submitted) {
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
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-emerald-950 sm:text-2xl">
          Mesajınız Bize Ulaştı!
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-800">
          Bize ulaştığınız için teşekkür ederiz. Mesajınız müşteri hizmetleri
          ekibimize iletildi. En kısa sürede sizinle iletişime geçeceğiz.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800"
        >
          <span>Yeni Bir Mesaj Gönder</span>
          <ArrowRightIcon width={14} height={14} />
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 text-left">
      {/* Ad Soyad */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fullName"
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Adınız Soyadınız <span className="text-rose-500">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          placeholder="Örn: Ahmet Yılmaz"
          className={`h-11 w-full rounded-2xl border bg-slate-50/60 px-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            state.fieldErrors?.fullName
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200 focus:border-primary focus:ring-primary/10"
          }`}
        />
        {state.fieldErrors?.fullName ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.fullName}
          </span>
        ) : null}
      </div>

      {/* İki Sütun: E-Posta ve Telefon */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            E-Posta Adresiniz <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ornek@alanadi.com"
            className={`h-11 w-full rounded-2xl border bg-slate-50/60 px-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
              state.fieldErrors?.email
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-primary focus:ring-primary/10"
            }`}
          />
          {state.fieldErrors?.email ? (
            <span className="text-xs text-rose-600">
              {state.fieldErrors.email}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="phone"
            className="text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Telefon Numaranız <span className="text-rose-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
            className={`h-11 w-full rounded-2xl border bg-slate-50/60 px-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
              state.fieldErrors?.phone
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-primary focus:ring-primary/10"
            }`}
          />
          {state.fieldErrors?.phone ? (
            <span className="text-xs text-rose-600">
              {state.fieldErrors.phone}
            </span>
          ) : null}
        </div>
      </div>

      {/* Konu Seçimi */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="subject"
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Konu <span className="text-rose-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          defaultValue={SUBJECT_OPTIONS[0]}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 transition outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {state.fieldErrors?.subject ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.subject}
          </span>
        ) : null}
      </div>

      {/* Mesaj */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Mesajınız <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="Sorunuzu, toptan talep detaylarınızı veya iletmek istediğiniz notu buraya yazabilirsiniz…"
          className={`w-full rounded-2xl border bg-slate-50/60 p-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            state.fieldErrors?.message
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200 focus:border-primary focus:ring-primary/10"
          }`}
        />
        {state.fieldErrors?.message ? (
          <span className="text-xs text-rose-600">
            {state.fieldErrors.message}
          </span>
        ) : null}
      </div>

      {/* Genel Hata Uyarısı */}
      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
        >
          {state.error}
        </div>
      ) : null}

      {/* Gönder Butonu */}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Mesajınız İletiliyor...</span>
          </>
        ) : (
          <>
            <span>Mesajı Gönder</span>
            <ArrowRightIcon width={16} height={16} />
          </>
        )}
      </button>

      <p className="mt-1 text-center text-[11px] text-slate-400">
        Gönderdiğiniz bilgiler yalnızca talebinizi yanıtlamak amacıyla kullanılır.
      </p>
    </form>
  );
}
