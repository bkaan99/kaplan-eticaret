import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/product-grid";
import { isFeatureEnabled } from "@/config/features";
import { getCurrentUser } from "@/modules/auth/session";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import { wishlistService } from "@/modules/wishlist/container";
import { EmptyWishlist } from "./empty-wishlist";
import { GuestWishlist } from "./guest-wishlist";

export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false },
};

async function WishlistContent() {
  const user = await getCurrentUser();
  if (!user) return <GuestWishlist />;

  const ids = await wishlistService.list(user.id);
  const cards = await catalogService.getCardsInOrder(
    ids,
    await getRequestPricing(),
  );

  if (cards.length === 0) {
    return <EmptyWishlist />;
  }

  return <ProductGrid products={cards} />;
}

export default function WishlistPage() {
  if (!isFeatureEnabled("wishlist")) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Favorilerim
      </h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        }
      >
        <WishlistContent />
      </Suspense>
    </div>
  );
}
