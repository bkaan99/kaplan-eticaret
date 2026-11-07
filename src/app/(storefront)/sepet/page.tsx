import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FreeShippingBar } from "@/components/storefront/free-shipping-bar";
import { Price } from "@/components/storefront/price";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { CartLines } from "./cart-lines";
import { EmptyCart } from "./empty-cart";

export const metadata: Metadata = {
  title: "Sepetim",
  robots: { index: false },
};

async function CartContent() {
  const cart = await getCurrentCart();

  if (cart.lines.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <FreeShippingBar subtotal={cart.subtotal} />
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
        {cart.hasIssues ? (
          <span className="rounded-theme bg-primary px-4 py-3 text-center text-primary-foreground opacity-50">
            Ödemeye geç
          </span>
        ) : (
          <Link
            href="/odeme"
            className="rounded-theme bg-primary px-4 py-3 text-center text-primary-foreground"
          >
            Ödemeye geç
          </Link>
        )}
        {cart.hasIssues ? (
          <p className="text-xs text-red-600">
            Sepetinizde satın alınamayan ürünler var.
          </p>
        ) : null}
      </aside>
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
