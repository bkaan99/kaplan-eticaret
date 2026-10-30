import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/storefront/logo";
import { TurnstileWidget } from "@/components/storefront/turnstile-widget";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş Yap | Kaplan Gurme",
  description: "Kaplan Gurme hesabınıza giriş yaparak siparişlerinizi takip edin ve avantajlı fiyatlardan yararlanın.",
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
    <div className="flex w-full flex-col gap-4">
      {params["kayit"] ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in"
        >
          <span className="text-base">🎉</span>
          <span>
            Kaydınız başarıyla oluşturuldu! E-postanıza gönderilen doğrulama
            bağlantısıyla hesabınızı aktifleştirebilirsiniz.
          </span>
        </div>
      ) : null}

      {params["sifre"] ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in"
        >
          <span className="text-base">✓</span>
          <span>
            Parolanız başarıyla güncellendi. Yeni parolanızla şimdi giriş
            yapabilirsiniz.
          </span>
        </div>
      ) : null}

      <LoginForm callbackUrl={callbackUrl} captcha={<TurnstileWidget />} />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/giris">) {
  return (
    <div className="mx-auto my-6 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl lg:my-10 lg:flex-row">
      {/* Sol: Marka ve Güvenlik Vitrini (Koyu Yeşil Zemin) */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-emerald-950 via-slate-900 to-emerald-900 p-8 text-white sm:p-10 lg:w-5/12">
        {/* Arka plan dekoratif desen */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="inline-block">
            <Logo inverted />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-400 backdrop-blur-xs">
              <span>🌾</span>
              <span>1985&apos;ten Beri Gedelek Geleneği</span>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl leading-snug">
              Doğal Fermantasyon, Güvenli Alışveriş
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bursa Gedelek&apos;in meşhur pınar sularıyla hazırlanan eşsiz
              lezzetler sofranıza güvenle ulaşıyor.
            </p>
          </div>

          {/* Avantaj Maddeleri */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              <span>Anlık kargo takibi ve sipariş geçmişi</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              <span>Kişiselleştirilmiş indirim kuponları ve hediye setleri</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              <span>Kurumsal bayiler ve toptan alıcılar için özel iskonto</span>
            </div>
          </div>
        </div>

        {/* Alt Güvenlik Rozetleri */}
        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>256-Bit SSL Şifreleme</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>KVKK Korumalı</span>
          </span>
        </div>
      </div>

      {/* Sağ: Giriş Formu */}
      <div className="flex flex-1 flex-col justify-center p-8 sm:p-10 lg:w-7/12">
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm">
              👋
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Kullanıcı Oturumu
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tekrar Hoş Geldiniz
          </h1>
          <p className="text-xs text-slate-500">
            Hesabınıza erişmek için e-posta ve parolanızı girin.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-xs font-medium text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mr-2" />
              <span>Yükleniyor...</span>
            </div>
          }
        >
          <LoginContent searchParams={searchParams} />
        </Suspense>

        {/* Alt Bağlantılar */}
        <div className="mt-6 flex flex-col gap-3.5 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          <p>
            Hesabınız yok mu?{" "}
            <Link
              href="/kayit"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
            >
              Hemen Ücretsiz Kayıt Olun →
            </Link>
          </p>

          <p className="border-t border-slate-100/80 pt-3 text-[11px] text-slate-400">
            Toptan alım veya kurumsal işletme misiniz?{" "}
            <Link
              href="/bayi-basvuru"
              className="font-semibold text-slate-700 hover:text-slate-900 hover:underline transition-colors"
            >
              Bayilik Başvurusu Yapın ↗
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
