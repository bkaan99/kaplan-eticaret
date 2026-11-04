import Image from "next/image";
import Link from "next/link";
import { isFeatureEnabled } from "@/config/features";
import type { ProductCard as ProductCardData } from "@/modules/catalog/catalog.types";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Price } from "./price";
import { QuickAddButton } from "./quick-add-button";

function discountPercent(price: string, compareAt: string | null) {
  if (!compareAt) return null;
  const current = Number(price);
  const original = Number(compareAt);
  if (!(original > current)) return null;
  return Math.round((1 - current / original) * 100);
}

export function ProductCard({
  product,
}: {
  product: ProductCardData & {
    rating?: { score: number; count: number };
  };
}) {
  const discount = product.priceVisible
    ? discountPercent(product.price, product.compareAtPrice)
    : null;

  const buttonClass =
    "mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors";

  return (
    <article className="group relative flex w-full flex-col">
      <Link href={`/urun/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={product.imageUrl ?? "/placeholder.svg"}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
            {!product.inStock ? (
              <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                Tükendi
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-brand-pepper px-2.5 py-1 text-[11px] font-bold text-white">
                %{discount} İndirim
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="mt-3 line-clamp-2 text-sm font-bold text-primary sm:text-[15px]">
          {product.name}
        </h3>

        {product.badges.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {product.badges.map((badge) => (
              <li
                key={badge}
                className={
                  badge === "Acılı"
                    ? "rounded-full bg-brand-pepper/10 px-2 py-0.5 text-[11px] font-bold text-brand-pepper"
                    : "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
                }
              >
                {badge}
              </li>
            ))}
          </ul>
        ) : null}

        {product.rating && product.rating.count > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
            <span className="text-amber-400">★</span>
            <span className="font-bold text-slate-900">
              {product.rating.score.toFixed(1)}
            </span>
            <span className="text-slate-400">({product.rating.count})</span>
          </div>
        ) : null}

        <div className="mt-1.5">
          {product.priceVisible ? (
            <Price
              value={product.price}
              compareAt={product.compareAtPrice}
              currency={product.currency}
              prefix={product.hasPriceRange ? "Başlangıç fiyatı" : undefined}
            />
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Fiyat için giriş yapın
            </span>
          )}
        </div>
      </Link>

      {product.quickAddVariantId ? (
        <QuickAddButton
          variantId={product.quickAddVariantId}
          product={product}
          className={`${buttonClass} bg-primary text-white hover:bg-brand-dark disabled:opacity-70`}
        />
      ) : (
        <Link
          href={`/urun/${product.slug}`}
          className={`${buttonClass} border-2 border-primary text-primary hover:bg-primary hover:text-white`}
        >
          {product.inStock ? "Seçenekleri Gör" : "Ürünü İncele"}
        </Link>
      )}

      {isFeatureEnabled("wishlist") ? (
        <WishlistButton
          productId={product.id}
          className="absolute top-2.5 right-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-brand-pepper"
        />
      ) : null}
    </article>
  );
}
