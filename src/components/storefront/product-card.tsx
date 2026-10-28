import Image from "next/image";
import Link from "next/link";
import { isFeatureEnabled } from "@/config/features";
import type { ProductCard as ProductCardData } from "@/modules/catalog/catalog.types";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ArrowRightIcon } from "./icons";
import { Price } from "./price";

function discountPercent(price: string, compareAt: string | null) {
  if (!compareAt) return null;
  const current = Number(price);
  const original = Number(compareAt);
  if (!(original > current)) return null;
  return Math.round((1 - current / original) * 100);
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = product.priceVisible
    ? discountPercent(product.price, product.compareAtPrice)
    : null;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      <Link href={`/urun/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl ?? "/placeholder.svg"}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {!product.inStock ? (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                Tükendi
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-brand-pepper px-2.5 py-1 text-xs font-semibold text-white">
                %{discount} indirim
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {product.brandName ? (
            <span className="text-[11px] font-semibold tracking-[0.2em] text-brand-leaf uppercase">
              {product.brandName}
            </span>
          ) : null}
          <h3 className="font-display text-base leading-snug font-semibold text-foreground sm:text-lg">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            {product.priceVisible ? (
              <Price
                value={product.price}
                compareAt={product.compareAtPrice}
                currency={product.currency}
                prefix={product.hasPriceRange ? "’den başlayan" : undefined}
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                Fiyat için giriş yapın
              </span>
            )}
            <span
              aria-hidden="true"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:inline-flex"
            >
              <ArrowRightIcon width={16} height={16} />
            </span>
          </div>
        </div>
      </Link>
      {isFeatureEnabled("wishlist") ? (
        <WishlistButton
          productId={product.id}
          className="absolute top-3 right-3 text-brand-pepper shadow-sm"
        />
      ) : null}
    </article>
  );
}
