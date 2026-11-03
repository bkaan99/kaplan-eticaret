import type { Metadata } from "next";
import Link from "next/link";
import {
  ClockIcon,
  MailIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  WhatsAppIcon,
} from "@/components/storefront/icons";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { LookupForm } from "./lookup-form";

export const metadata: Metadata = {
  title: "Sipariş Sorgulama & Kargo Takibi",
  description: `${siteConfig.name} siparişinizin hazırlık ve kargo durumunu anında sorgulayın.`,
  robots: { index: false },
};

/**
 * Tek renk (monochrome) kargo ve paket sorgulama ikonu.
 */
function TrackingMonoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="56"
      height="56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Dış kesikli daire */}
      <circle
        cx="32"
        cy="32"
        r="28"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="opacity-25"
      />

      {/* Koli / Paket silüeti */}
      <path
        d="m32 16 16 8.5v15L32 48l-16-8.5v-15z"
        className="opacity-90"
      />
      <path d="M32 16v32" strokeWidth="1.8" className="opacity-40" />
      <path d="m16 24.5 16 8.5 16-8.5" strokeWidth="1.8" className="opacity-90" />

      {/* Büyüteç sorgulama simgesi */}
      <circle cx="44" cy="42" r="7" fill="white" strokeWidth="2" />
      <path d="m49 47 4 4" strokeWidth="2.5" />

      {/* Minik ışıltı artıları */}
      <path d="M12 18v3M10.5 19.5h3" strokeWidth="1.5" className="opacity-40" />
    </svg>
  );
}

export default function OrderLookupPage() {
  const whatsappHref = `https://wa.me/${storefrontContact.phoneTel.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Merhaba, siparişimin durumu hakkında bilgi almak istiyorum.",
  )}`;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-4 sm:py-8">
      {/* Başlık ve Rozet Bölümü */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm shadow-slate-200/60 ring-8 ring-slate-100/80">
          <TrackingMonoIcon />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sipariş Sorgulama & Kargo Takibi
        </h1>
        <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
          Üye olmadan verdiğiniz siparişinizin hazırlık aşamasını, kargo takip
          numarasını ve tahmini teslimat tarihini buradan anında sorgulayabilirsiniz.
        </p>
      </div>

      {/* Merkezi Form Kartı */}
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 sm:p-9">
        <LookupForm />
      </div>

      {/* Bilgilendirme Kartları: Sipariş Numaram Nerede? */}
      <div className="flex flex-col gap-4">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Sipariş Bilgilerinizi Nerede Bulabilirsiniz?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Kart 1: Onay E-postası */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <MailIcon width={18} height={18} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Onay E-Postanızda
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Sipariş verdiğinizde iletilen onay e-postasının konu başlığında ve
              sipariş özeti bölümünde yer alır.
            </p>
          </div>

          {/* Kart 2: SMS Bildirimi */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <TruckIcon width={18} height={18} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Kargo SMS Bildiriminde
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Paketiniz yola çıktığında telefonunuza gönderilen SMS içinde kargo
              takip kodu ile birlikte belirtilir.
            </p>
          </div>

          {/* Kart 3: Üyelik Hesabı */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-2xs border border-slate-200/60">
              <UserIcon width={18} height={18} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Hesabım Sayfasında
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Kayıtlı bir hesabınız varsa{" "}
              <Link
                href="/hesabim"
                className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
              >
                Siparişlerim
              </Link>{" "}
              sekmesinden tüm geçmişinizi tek tıkla görebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Yardım & Canlı Destek Alanı */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-slate-900">
            Sipariş bilgilerinize ulaşamadınız mı?
          </span>
          <span className="text-xs text-slate-500">
            Müşteri destek ekibimiz siparişinizi bulmanızda size memnuniyetle
            yardımcı olur.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <a
            href={`tel:${storefrontContact.phoneTel}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
          >
            <PhoneIcon width={14} height={14} className="text-slate-400" />
            <span>{storefrontContact.phone}</span>
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#20ba5a]"
          >
            <WhatsAppIcon width={16} height={16} />
            <span>WhatsApp Destek</span>
          </a>
        </div>
      </div>
    </div>
  );
}
