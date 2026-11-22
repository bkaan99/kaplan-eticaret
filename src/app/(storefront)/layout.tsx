import { connection } from "next/server";
import { Suspense } from "react";
import { MotionProvider } from "@/components/motion/motion";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { AnalyticsScripts } from "@/shared/analytics/analytics-scripts";
import { CookieBanner } from "@/shared/analytics/cookie-banner";

/** Build sırasında D1 yok; header/footer istek anında render edilir. */
export default async function StorefrontLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <MotionProvider>
      {/* `contents`: yerleşimi bozmadan vitrin yazı tipini uygular */}
      <div className="contents font-storefront">
        <SiteHeader />
        {/* `overflow-x-clip` (hidden değil): kaydırma kabı oluşturmaz, böylece
            içerideki `position: sticky` öğeler (ör. bidon paneli) çalışır. */}
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-clip px-4 py-6 lg:px-8 2xl:px-12">
          {children}
        </main>
        <SiteFooter />
        <Suspense fallback={null}>
          <WhatsAppButton />
        </Suspense>
      </div>
      <CookieBanner />
      <AnalyticsScripts />
    </MotionProvider>
  );
}
