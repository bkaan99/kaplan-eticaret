import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FreeShippingBar } from "@/components/storefront/free-shipping-bar";
import { Price } from "@/components/storefront/price";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { getCachedShippingSettings } from "@/modules/settings/cached";
import { CartLines } from "./cart-lines";
import { EmptyCart } from "./empty-cart";

export const metadata: Metadata = {
  title: "Sepetim",
  robots: { index: false },
};

async function CartContent() {
  const [cart, shipping] = await Promise.all([
    getCurrentCart(),
    getCachedShippingSettings(),
  ]);

  if (cart.lines.length === 0) {
    return <EmptyCart freeShippingThreshold={shipping.freeShippingThreshold} />;
  }

  const checkoutClassName =
    "block rounded-theme bg-primary px-4 py-3 text-center text-primary-foreground";

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[1fr_320px] lg:pb-0">
      <div className="flex flex-col gap-4">
        <FreeShippingBar
          subtotal={cart.subtotal}
          threshold={shipping.freeShippingThreshold}
        />
        <CartLines cart={cart} />
      </div>
      <aside className="flex h-fit flex-col gap-4 rounded-theme border border-border p-5">
        <h2 className="font-semibold">Sipariş özeti</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Ara toplam ({cart.itemCount} ürün)</span>
          <Price value={cart.subtotal} currency={cart.currency} />
        </div>
        <p className="text-xs text-muted-foreground">
          KDV dahildir. Kargo ücreti ödeme adımında hesaplanır; kupon indirimi
          ücretsiz kargo limitini etkileyebilir.
        </p>
        <div className="hidden lg:block">
          {cart.hasIssues ? (
            <span className={`${checkoutClassName} opacity-50`}>Ödemeye geç</span>
          ) : (
            <Link href="/odeme" className={checkoutClassName}>
              Ödemeye geç
            </Link>
          )}
        </div>
        {cart.hasIssues ? (
          <p className="text-xs text-red-600">
            Sepetinizde satın alınamayan ürünler var.
          </p>
        ) : null}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-md lg:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Ara toplam ({cart.itemCount} ürün)
          </span>
          <span className="font-semibold">
            <Price value={cart.subtotal} currency={cart.currency} />
          </span>
        </div>
        {cart.hasIssues ? (
          <span className={`${checkoutClassName} opacity-50`}>Ödemeye geç</span>
        ) : (
          <Link href="/odeme" className={checkoutClassName}>
            Ödemeye geç
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Sepetim
      </h1>
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        }
      >
        <CartContent />
      </Suspense>
    </div>
  );
}
