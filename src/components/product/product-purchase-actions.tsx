"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { BagIcon } from "@/components/storefront/icons";
import { EASE_OUT } from "@/components/motion/motion";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import { StockAlertForm } from "./stock-alert-form";
import type { ProductViewState } from "./use-product-view";

export function ProductPurchaseActions({
  product,
  state,
  wishlistEnabled,
  highlights,
}: {
  product: ProductDetail;
  state: ProductViewState;
  wishlistEnabled: boolean;
  highlights?: ReactNode;
}) {
  const {
    variant,
    quantity,
    changeQuantity,
    maxQuantity,
    canBuy,
    pending,
    justAdded,
    addToCart,
    message,
  } = state;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2 sm:gap-3">
          <div className="flex items-center rounded-full border border-border bg-white">
            <label className="sr-only" htmlFor="quantity">
              Adet
            </label>
            <button
              type="button"
              aria-label="Adedi azalt"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={quantity <= 1}
              className="inline-flex h-12 w-9 items-center justify-center rounded-l-full sm:w-11 text-lg text-primary disabled:opacity-30"
            >
              −
            </button>
            <input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) =>
                changeQuantity(Math.floor(Number(event.target.value)))
              }
              className="w-10 [appearance:textfield] bg-transparent text-center text-sm font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Adedi artır"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className="inline-flex h-12 w-9 items-center justify-center rounded-r-full sm:w-11 text-lg text-primary disabled:opacity-30"
            >
              +
            </button>
          </div>

          <motion.button
            type="button"
            onClick={addToCart}
            disabled={!canBuy || pending}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex h-12 flex-1 overflow-hidden items-center justify-center gap-2 rounded-full bg-primary px-4 whitespace-nowrap sm:px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-brand-dark disabled:opacity-50 disabled:shadow-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={justAdded ? "added" : "idle"}
                className="inline-flex items-center gap-2"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                {justAdded ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="M5 12.5 10 17 19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      />
                    </svg>
                    Sepete eklendi
                  </>
                ) : (
                  <>
                    <BagIcon width={18} height={18} />
                    {pending
                      ? "Ekleniyor..."
                      : !variant
                        ? "Seçenekleri belirleyin"
                        : variant.inStock
                          ? "Sepete ekle"
                          : "Tükendi"}
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {wishlistEnabled ? (
            <WishlistButton
              productId={product.id}
              className="h-12! w-12! shrink-0 text-brand-pepper"
            />
          ) : null}
        </div>

        {variant?.inStock &&
        variant.availableQuantity !== null &&
        variant.availableQuantity <= 5 ? (
          <p className="text-sm font-medium text-brand-pepper">
            Acele edin, son {variant.availableQuantity} ürün
          </p>
        ) : null}

        {message ? (
          <p
            role={message.error ? "alert" : "status"}
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${message.error ? "bg-red-50 text-red-700" : "bg-primary/10 text-primary"}`}
          >
            {message.text}
            {message.error ? null : (
              <>
                {" · "}
                <a href="/sepet" className="underline">
                  Sepete git
                </a>
              </>
            )}
          </p>
        ) : null}
      </div>

      {variant && !variant.inStock ? (
        <StockAlertForm key={variant.id} variantId={variant.id} />
      ) : null}

      {highlights}
    </>
  );
}
