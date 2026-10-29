"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/components/motion/motion";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import { formatMoney } from "@/shared/money";
import { useProductView } from "./use-product-view";
import { ProductGallery } from "./product-gallery";
import { ProductOptions } from "./product-options";
import { ProductPurchaseActions } from "./product-purchase-actions";
import { ProductAccordions } from "./product-accordions";

export function ProductView({
  product,
  wishlistEnabled,
  highlights,
  shippingInfo,
}: {
  product: ProductDetail;
  wishlistEnabled: boolean;
  /** Sepet butonunun altında gösterilen güven maddeleri */
  highlights?: ReactNode;
  /** "Kargo ve iade" bölümünün içeriği */
  shippingInfo?: ReactNode;
}) {
  const state = useProductView(product);
  const { variant } = state;

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      {/* Sol Sütun: Ürün Görsel Galerisi */}
      <ProductGallery state={state} />

      {/* Sağ Sütun: Başlık, Fiyat, Seçenekler ve Satın Alma */}
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
      >
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {product.name}
          </h1>
          {product.attributes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {product.attributes.flatMap((attribute) =>
                attribute.values.map((value) => (
                  <li
                    key={`${attribute.name}-${value}`}
                    className="rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary"
                  >
                    {value}
                  </li>
                )),
              )}
            </ul>
          ) : null}
        </div>

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

        <ProductAccordions product={product} shippingInfo={shippingInfo} />
      </motion.div>
    </div>
  );
}
