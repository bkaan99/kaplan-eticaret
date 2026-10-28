"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { addToCartAction } from "@/app/(storefront)/sepet/actions";
import { StockAlertForm } from "./stock-alert-form";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { EASE_OUT } from "@/components/motion/motion";
import { BagIcon } from "@/components/storefront/icons";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import {
  defaultSelection,
  findVariant,
  imagesForSelection,
  isValueAvailable,
  type Selection,
} from "@/modules/catalog/variant-selection";
import { trackEvent } from "@/shared/analytics/client";
import { formatMoney } from "@/shared/money";

const MAX_QUANTITY = 99;

function discountPercent(price: string, compareAt: string | null) {
  if (!compareAt) return null;
  const current = Number(price);
  const original = Number(compareAt);
  if (!(original > current)) return null;
  return Math.round((1 - current / original) * 100);
}

function InfoSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border py-1 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold">
        <h2>{title}</h2>
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

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
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(product.variants, product.options),
  );
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  /** Sepete eklendikten sonra butonda kısa bir onay gösterilir */
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const variant = useMemo(
    () => findVariant(product.variants, product.options, selection),
    [product, selection],
  );
  const images = useMemo(
    () => imagesForSelection(product.images, selection),
    [product.images, selection],
  );
  const image = images[Math.min(imageIndex, images.length - 1)]!;

  const maxQuantity = Math.min(
    variant?.availableQuantity ?? MAX_QUANTITY,
    MAX_QUANTITY,
  );
  const canBuy = product.priceVisible && variant !== null && variant.inStock;
  const discount = variant
    ? discountPercent(variant.price, variant.compareAtPrice)
    : null;

  function select(optionId: string, valueId: string) {
    setSelection((current) => ({ ...current, [optionId]: valueId }));
    setImageIndex(0);
    setQuantity(1);
    setMessage(null);
  }

  function changeQuantity(next: number) {
    setQuantity(Math.min(Math.max(1, next || 1), maxQuantity));
  }

  function addToCart() {
    if (!variant) return;

    startTransition(async () => {
      const result = await addToCartAction(variant.id, quantity);
      if (!result.ok) {
        setMessage({ text: result.error ?? "Sepete eklenemedi", error: true });
        return;
      }

      setMessage({ text: "Ürün sepete eklendi", error: false });
      setJustAdded(true);
      const unit = Number(variant.price);
      trackEvent("add_to_cart", {
        currency: variant.currency,
        value: unit * quantity,
        item: {
          id: product.id,
          name: product.name,
          price: unit,
          quantity,
          variant: variant.sku,
          brand: product.brand?.name ?? null,
        },
      });
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      <motion.div
        className="flex flex-col gap-3 md:sticky md:top-40 md:self-start"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
      >
        <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-border bg-muted">
          <AnimatePresence initial={false}>
            <motion.div
              key={image.url}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {discount ? (
              <motion.span
                key="discount"
                className="absolute top-4 left-4 rounded-full bg-brand-pepper px-3 py-1.5 text-sm font-semibold text-white"
                initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                %{discount} indirim
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        {images.length > 1 ? (
          <ul className="flex gap-3">
            {images.map((item, index) => (
              <li key={`${item.url}-${index}`}>
                <button
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Görsel ${index + 1}`}
                  aria-current={index === imageIndex}
                  className={`relative h-20 w-20 overflow-hidden rounded-2xl border-2 bg-muted transition ${index === imageIndex ? "border-primary" : "border-transparent hover:border-border"}`}
                >
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </motion.div>

      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
      >
        <div className="flex flex-col gap-3">
          {product.brand ? (
            <span className="text-xs font-semibold tracking-[0.25em] text-brand-leaf uppercase">
              {product.brand.name}
            </span>
          ) : null}
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-brand-dark sm:text-5xl">
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

        {product.options.map((option) => (
          <fieldset key={option.id} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">
              {option.name}
            </legend>
            <div className="flex flex-wrap gap-3">
              {option.values.map((value) => {
                const active = selection[option.id] === value.id;
                const available = isValueAvailable(
                  product.variants,
                  selection,
                  option.id,
                  value.id,
                );
                const candidate = findVariant(
                  product.variants,
                  product.options,
                  { ...selection, [option.id]: value.id },
                );

                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => select(option.id, value.id)}
                    className={[
                      "relative flex min-w-28 flex-col items-start gap-0.5 rounded-2xl border-2 border-border bg-white px-4 py-3 text-left transition-colors",
                      active ? "" : "hover:border-primary/40",
                      available ? "" : "opacity-40 line-through",
                    ].join(" ")}
                  >
                    {active ? (
                      <motion.span
                        layoutId={`option-${option.id}`}
                        aria-hidden="true"
                        className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                      />
                    ) : null}
                    <span className="relative text-sm font-semibold">
                      {value.value}
                    </span>
                    {product.priceVisible && candidate ? (
                      <span className="relative text-xs text-muted-foreground">
                        {formatMoney(candidate.price, candidate.currency)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

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

        <div className="border-t border-border">
          {product.description ? (
            <InfoSection title="Ürün açıklaması" defaultOpen>
              <p className="whitespace-pre-line">{product.description}</p>
            </InfoSection>
          ) : null}

          {product.attributes.length > 0 ? (
            <InfoSection title="Özellikler">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                {product.attributes.map((attribute) => (
                  <div key={attribute.name} className="contents">
                    <dt>{attribute.name}</dt>
                    <dd className="font-medium text-foreground">
                      {attribute.values.join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </InfoSection>
          ) : null}

          <InfoSection title="Saklama ve tüketim">
            <p>
              Açılmamış ürünü serin, kuru ve güneş görmeyen bir yerde saklayın.
              Açıldıktan sonra buzdolabında muhafaza edin; turşularda ürünün
              salamura suyunun içinde kalmasına dikkat edin ve servis ederken
              temiz, kuru bir çatal kullanın.
            </p>
          </InfoSection>

          {shippingInfo ? (
            <InfoSection title="Kargo ve iade">{shippingInfo}</InfoSection>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
