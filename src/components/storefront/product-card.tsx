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

function getProductBadges(slug: string) {
  if (slug.includes("aci-sivri") || slug.includes("acili")) {
    return { tag: "🌶️ Acılı", badgeBg: "bg-red-50 text-red-700 border-red-200" };
  }
  if (slug.includes("tombul")) {
    return { tag: "🌶️ Orta Acı", badgeBg: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  if (slug.includes("salgam") || slug.includes("suyu")) {
    return { tag: "🍷 Adana Usulü", badgeBg: "bg-rose-50 text-rose-800 border-rose-200" };
  }
  if (slug.includes("kutu")) {
    return { tag: "🎁 Gurme Seçki", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  }
  return { tag: "🌿 Doğal Fermente", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
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
  const { tag, badgeBg } = getProductBadges(product.slug);

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      <Link href={`/urun/${product.slug}`} className="flex flex-1 flex-col">
        {/* Ürün Görseli */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 p-2">
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <Image
              src={product.imageUrl ?? "/placeholder.svg"}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>

          {/* Rozetler */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
            {!product.inStock ? (
              <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
                Tükendi
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-brand-pepper px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                %{discount} İndirim
              </span>
            ) : null}
          </div>
        </div>

        {/* Ürün Bilgileri */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {/* Üst Satır: Özellik Etiketi */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeBg}`}
            >
              {tag}
            </span>
            {product.brandName ? (
              <span className="text-[11px] font-medium text-slate-400">
                {product.brandName}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                Cam Ambalaj
              </span>
            )}
          </div>

          {/* Ürün Adı */}
          <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-primary sm:text-lg">
            {product.name}
          </h3>

          {/* Doğal Ürün Vurgusu veya Gerçek Değerlendirme */}
          {product.rating && product.rating.count > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="flex text-amber-400">★</span>
              <span className="font-bold text-slate-900">
                {product.rating.score.toFixed(1)}
              </span>
              <span className="text-slate-400">({product.rating.count})</span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>
                {product.hasPriceRange
                  ? "Farklı boy seçenekleri"
                  : "%100 Doğal fermantasyon"}
              </span>
            </div>
          )}

          {/* Fiyat ve Buton Satırı */}
          <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex flex-col">
              {product.priceVisible ? (
                <Price
                  value={product.price}
                  compareAt={product.compareAtPrice}
                  currency={product.currency}
                  prefix={product.hasPriceRange ? "’den başlayan" : undefined}
                />
              ) : (
                <span className="text-xs font-medium text-slate-500">
                  Fiyat için giriş yapın
                </span>
              )}
            </div>

            {/* İncele / Sepet Butonu */}
            <span
              aria-hidden="true"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/20"
            >
              <span>İncele</span>
              <ArrowRightIcon width={13} height={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>

      {/* Favori Butonu */}
      {isFeatureEnabled("wishlist") ? (
        <WishlistButton
          productId={product.id}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-brand-pepper"
        />
      ) : null}
    </article>
  );
}
