"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, MotionProvider } from "@/components/motion/motion";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import { formatMoney } from "@/shared/money";
import { ProductGallery } from "./product-gallery";
import { ProductOptions } from "./product-options";
import { ProductPurchaseActions } from "./product-purchase-actions";
import { useProductView } from "./use-product-view";

/**
 * PDP etkileşim adası: galeri + fiyat + seçenek + sepete ekle.
 * Başlık ve akordeon sunucudan `title` / `footer` slot’larıyla gelir (hydrate olmaz).
 */
export function ProductInteractive({
  product,
  wishlistEnabled,
  highlights,
  title,
  footer,
}: {
  product: ProductDetail;
  wishlistEnabled: boolean;
  highlights?: ReactNode;
  title: ReactNode;
  footer?: ReactNode;
}) {
  const state = useProductView(product);
  const { variant } = state;

  return (
    <MotionProvider>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      <ProductGallery state={state} />

      <div className="flex flex-col gap-6">
        {title}

        {!product.priceVisible ? (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm">
            Fiyatları görmek için bayi girişi yapın.{" "}
            <a href="/giris" className="underline">
              Giriş yap
            </a>{" "}
            veya{" "}
            <a href="/bayi-basvuru" className="underline">
              bayi olun
            </a>
            .
          </p>
        ) : variant ? (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <motion.span
                key={variant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className={`text-3xl font-bold ${variant.compareAtPrice ? "text-brand-pepper" : "text-primary"}`}
              >
                {formatMoney(variant.price, variant.currency)}
              </motion.span>
              {variant.compareAtPrice ? (
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(variant.compareAtPrice, variant.currency)}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">KDV dahil</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Fiyatı görmek için seçenekleri belirleyin.
          </p>
        )}

        <ProductOptions product={product} state={state} />

        <ProductPurchaseActions
          product={product}
          state={state}
          wishlistEnabled={wishlistEnabled}
          highlights={highlights}
        />

        {footer}
      </div>
      </div>
    </MotionProvider>
  );
}
