"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

const control =
  "peer h-14 w-full rounded-xl border border-slate-900/10 bg-white px-4 pt-5 pb-2 text-[15px] leading-none text-brand-dark shadow-[0_1px_0_rgba(11,35,24,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-transparent focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(21,71,52,0.12)]";

const floatLabel =
  "pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-[15px] text-slate-500 transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-[0.06em] peer-focus:text-primary peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-[0.06em] peer-[:not(:placeholder-shown)]:text-slate-500 peer-[:not(:placeholder-shown)]:uppercase";

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
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="relative">
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="E-posta"
          className={control}
        />
        <label htmlFor="login-email" className={floatLabel}>
          E-posta
        </label>
      </div>

      <div className="relative">
        <input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Parola"
          className={`${control} pr-24`}
        />
        <label htmlFor="login-password" className={floatLabel}>
          Parola
        </label>
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute top-1/2 right-2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md px-3 text-xs font-semibold tracking-wide text-slate-500 transition hover:bg-primary/5 hover:text-primary"
        >
          {showPassword ? "Gizle" : "Göster"}
        </button>
      </div>

      <div className="flex justify-end pt-0.5">
        <Link
          href="/sifremi-unuttum"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Parolamı unuttum
        </Link>
      </div>

      {captcha}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-brand-pepper/20 bg-brand-pepper/5 px-3.5 py-3 text-sm font-medium text-brand-pepper"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
