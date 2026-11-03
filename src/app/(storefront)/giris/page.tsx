import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/motion";
import { TurnstileWidget } from "@/components/storefront/turnstile-widget";
import { siteConfig } from "@/config/site.config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş yap",
  description: `${siteConfig.name} hesabınıza giriş yapın.`,
  robots: { index: false },
};

async function LoginContent({
  searchParams,
}: Pick<PageProps<"/giris">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl =
    typeof params["callbackUrl"] === "string"
      ? params["callbackUrl"]
      : "/hesabim";

  return (
    <div className="flex w-full flex-col gap-5">
      {params["kayit"] ? (
        <p
          role="status"
          className="border-l-2 border-brand-leaf pl-3 text-sm text-brand-dark"
        >
          Kaydınız oluştu. E-postadaki doğrulama bağlantısıyla hesabınızı
          etkinleştirin.
        </p>
      ) : null}

      {params["sifre"] ? (
        <p
          role="status"
          className="border-l-2 border-brand-leaf pl-3 text-sm text-brand-dark"
        >
          Parolanız güncellendi. Yeni parolanızla giriş yapabilirsiniz.
        </p>
      ) : null}

      <LoginForm callbackUrl={callbackUrl} captcha={<TurnstileWidget />} />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/giris">) {
  return (
    <section className="full-bleed -mt-6">
      <div className="relative grid min-h-[calc(100dvh-8rem)] bg-primary lg:grid-cols-2">
        {/* Ürün görseli — kenardan kenara, kart yok */}
        <div className="relative min-h-52 overflow-hidden sm:min-h-72 lg:min-h-full">
          <Image
            src="/images/hero/hero-tursu-kavanozlar.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-login-pan object-cover object-[center_40%]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-brand-dark/80 via-brand-dark/25 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-brand-dark/20 lg:to-brand-dark/55"
          />
          <Reveal className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 lg:p-10">
            <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Kaplan
            </p>
            <p className="mt-1 text-[11px] font-bold tracking-[0.28em] text-brand-gold uppercase">
              Gurme Turşu
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
              {siteConfig.description}
            </p>
          </Reveal>
        </div>

        {/* Form paneli — hero’daki yeşil panel dili */}
        <div className="relative flex flex-col justify-center bg-[#f3f4ef] px-6 py-10 text-brand-dark sm:px-10 lg:px-14 lg:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-brand-gold/70 lg:block"
          />

          <Reveal y={16} className="mx-auto w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Giriş yap
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Siparişlerinizi ve hesabınızı yönetmek için devam edin.
            </p>

            <div className="mt-8">
              <Suspense
                fallback={
                  <p className="py-8 text-sm text-slate-500">Yükleniyor…</p>
                }
              >
                <LoginContent searchParams={searchParams} />
              </Suspense>
            </div>

            <div className="mt-8 space-y-3 border-t border-slate-300/60 pt-6 text-sm text-slate-600">
              <p>
                Hesabınız yok mu?{" "}
                <Link
                  href="/kayit"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Kayıt olun
                </Link>
              </p>
              <p>
                Toptan alım için{" "}
                <Link
                  href="/bayi-basvuru"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  bayilik başvurusu
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
