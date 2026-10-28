"use client";

import { AnimatePresence, motion } from "motion/react";

/** Sepet adedi değiştiğinde rozet zıplayarak güncellenir. */
export function CartCount({ count }: { count: number }) {
  return (
    <AnimatePresence initial={false}>
      {count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [1.5, 1], opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-brand-dark"
        >
          {count}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
