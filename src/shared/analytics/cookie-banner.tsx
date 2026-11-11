"use client";

import { useSyncExternalStore } from "react";
import { readConsent, subscribeConsent, writeConsent } from "./consent";
import type { ConsentState } from "./dispatcher";

function useConsent(): ConsentState {
  // Sunucuda "granted" varsayılır; banner yalnızca istemcide, tercih yoksa görünür.
  return useSyncExternalStore(subscribeConsent, readConsent, () => "granted");
}

export function CookieBanner() {
  const consent = useConsent();
  if (consent !== "unknown") return null;

  return (
    <div
      data-cookie-banner
      role="dialog"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg [body:has([data-builder-bar])_&]:bottom-[calc(6.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Deneyiminizi iyileştirmek ve ölçümleme yapmak için çerezler
          kullanıyoruz. Zorunlu olmayan çerezleri kabul edebilir veya
          reddedebilirsiniz.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => writeConsent("denied")}
            className="min-h-11 flex-1 whitespace-nowrap rounded-theme border border-border px-4 py-2 text-sm sm:flex-none"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={() => writeConsent("granted")}
            className="min-h-11 flex-1 whitespace-nowrap rounded-theme bg-primary px-4 py-2 text-sm text-primary-foreground sm:flex-none"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
