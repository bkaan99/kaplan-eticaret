import { Suspense } from "react";
import { MotionProvider } from "@/components/motion/motion";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { AnalyticsScripts } from "@/shared/analytics/analytics-scripts";
import { CookieBanner } from "@/shared/analytics/cookie-banner";

export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      {/* `contents`: yerleşimi bozmadan vitrin yazı tipini uygular */}
      <div className="contents font-storefront">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
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
