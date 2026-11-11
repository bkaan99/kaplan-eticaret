"use client";

/** Sepet adedi değiştiğinde rozet kısa bir CSS pulse ile güncellenir. */
export function CartCount({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      key={count}
      className="inline-flex h-5 min-w-5 animate-[cart-pop_280ms_ease-out] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-brand-dark"
    >
      {count}
    </span>
  );
}
