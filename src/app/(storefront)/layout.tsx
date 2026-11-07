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
        <main className="mx-auto w-full max-w-[1600px] px-4 lg:px-8 2xl:px-12 flex-1 py-6">
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
