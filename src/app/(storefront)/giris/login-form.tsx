"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({
  callbackUrl,
  captcha,
}: {
  callbackUrl: string;
  captcha?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4.5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {/* E-posta Alanı */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
        >
          <span>E-Posta Adresi</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="ornek@kaplangurme.com"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-600/15"
          />
        </div>
      </div>

      {/* Parola Alanı */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
          >
            <span>Parola</span>
            <span className="text-red-500">*</span>
          </label>
          <Link
            href="/sifremi-unuttum"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
          >
            Parolamı unuttum?
          </Link>
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>

          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-600/15"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Captcha */}
      {captcha}

      {/* Hata Mesajı */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 animate-in fade-in"
        >
          <span className="text-base">⚠️</span>
          <span>{state.error}</span>
        </div>
      ) : null}

      {/* Giriş Butonu */}
      <button
        type="submit"
        disabled={pending}
        className="group relative mt-1 flex h-11.5 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-emerald-800 hover:shadow-lg disabled:opacity-60 cursor-pointer"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Giriş Yapılıyor...</span>
          </>
        ) : (
          <>
            <span>Güvenli Giriş Yap</span>
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </>
        )}
      </button>
    </form>
  );
}
