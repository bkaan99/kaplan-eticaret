import { Fraunces, Montserrat } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { AnalyticsScripts } from "@/shared/analytics/analytics-scripts";
import { CookieBanner } from "@/shared/analytics/cookie-banner";

/** Vitrin gövde yazı tipi */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
});

/** Başlıklar için serif yazı tipi */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

const storefrontFontClassName = `${montserrat.variable} ${fraunces.variable} font-storefront`;

/** Build sırasında D1 yok; header/footer istek anında render edilir. */
export default async function StorefrontLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <div className={`${storefrontFontClassName} contents`}>
      <SiteHeader drawerFontClassName={storefrontFontClassName} />
      <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-hidden px-4 py-6 lg:px-8 2xl:px-12">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
      <CookieBanner />
      <AnalyticsScripts />
    </div>
  );
}
