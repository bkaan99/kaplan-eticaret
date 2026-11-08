import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isGoogleAuthEnabled } from "@/auth";
import { TurnstileWidget } from "@/components/storefront/turnstile-widget";
import { GoogleSignInButton } from "../giris/google-sign-in-button";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Kayıt ol",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h1 className="text-2xl font-semibold">Kayıt ol</h1>
      {isGoogleAuthEnabled() ? (
        <div className="flex w-full flex-col gap-4">
          <GoogleSignInButton callbackUrl="/hesabim" />
          <div className="relative py-1 text-center text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <span className="relative z-10 bg-background px-3">veya</span>
            <span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
            />
          </div>
        </div>
      ) : null}
      <Suspense fallback={null}>
        <RegisterForm captcha={<TurnstileWidget />} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
