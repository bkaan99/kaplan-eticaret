"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT } from "@/components/motion/motion";
import type { ProductViewState } from "./use-product-view";

export function ProductGallery({ state }: { state: ProductViewState }) {
  const { images, image, imageIndex, setImageIndex, discount } = state;

  return (
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
  );
}
