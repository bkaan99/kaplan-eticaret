"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRightIcon,
  MailIcon,
  SearchIcon,
} from "@/components/storefront/icons";
import { lookupOrderAction, type LookupState } from "./actions";

const initial: LookupState = {};

export function LookupForm() {
  const [state, formAction, pending] = useActionState(
    lookupOrderAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Sipariş Numarası */}
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor="orderNumber"
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Sipariş Numarası
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-sm font-bold text-slate-400">
            #
          </span>
          <input
            id="orderNumber"
            name="orderNumber"
            required
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck="false"
            placeholder="Örn: ORD-2026-ABCD veya 8 haneli kod"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pr-4 pl-9 text-sm font-semibold tracking-wide text-slate-900 uppercase transition outline-none placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <span className="text-[11px] text-slate-500">
          Sipariş onay e-postanızın başlığında ve SMS bildiriminizde yer alır.
        </span>
      </div>

      {/* E-posta */}
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor="email"
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Siparişte Verilen E-Posta
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <MailIcon width={18} height={18} />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ornek@alanadi.com"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pr-4 pl-10 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Hata Mesajı */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-left text-xs leading-relaxed text-rose-800"
        >
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200 text-[10px] font-bold text-rose-800">
            !
          </span>
          <span>{state.error}</span>
        </div>
      ) : null}

      {/* Gönder Butonu */}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Sipariş Sorgulanıyor...</span>
          </>
        ) : (
          <>
            <SearchIcon width={16} height={16} />
            <span>Siparişi Sorgula</span>
            <ArrowRightIcon width={16} height={16} />
          </>
        )}
      </button>

      {/* Üye Girişi Hatırlatması */}
      <div className="mt-1 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500">
          Zaten kayıtlı bir hesabınız var mı?{" "}
          <Link
            href="/giris?callbackUrl=/hesabim"
            className="font-semibold text-primary transition hover:underline"
          >
            Giriş Yaparak Takip Et →
          </Link>
        </p>
      </div>
    </form>
  );
}
