"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/shared/money";
import type { CustomPickleBuilderState } from "./use-custom-pickle-builder";

function scrollToStep(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Altta sabit çubuk: doluluk, fiyat, adet ve bir sonraki adım. */
export function BuilderBar({ builder }: { builder: CustomPickleBuilderState }) {
  const {
    size,
    unit,
    currency,
    quantity,
    setQuantity,
    filled,
    isFull,
    hasVegetable,
    chosen,
    canAdd,
    addToCart,
    pending,
    justAdded,
    clear,
    message,
  } = builder;

  const cta = justAdded
    ? "Sepete eklendi ✓"
    : pending
      ? "Ekleniyor..."
      : !hasVegetable
        ? "Sebze seçin"
        : !isFull
          ? "Oranları tamamlayın"
          : "Sepete ekle";

  return (
    <div
      data-builder-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-amber-300 bg-primary text-white shadow-[0_-8px_24px_rgba(11,35,24,0.25)]"
    >
      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={`px-4 py-1.5 text-center text-xs font-semibold ${message.error ? "bg-red-600" : "bg-brand-dark"}`}
        >
          {message.text}
          {justAdded ? (
            <>
              {" · "}
              <Link href="/sepet" className="underline">
                Sepete git
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Image
          src="/images/urunler/kendi-tursunu-yap.svg"
          alt=""
          width={48}
          height={48}
          className="hidden rounded-lg bg-white p-0.5 sm:block"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-tight font-bold tabular-nums sm:text-2xl">
            {chosen.length === 0
              ? `%${filled} dolu`
              : formatMoney(unit * quantity, currency)}
          </p>
          <p className="truncate text-xs text-white/80">
            {size?.label ?? "Bidon"} ·{" "}
            {hasVegetable ? `%${filled} dolu` : "sebze seçerek başlayın"}
          </p>
        </div>

        <div className="flex items-center rounded-full border border-white/30">
          <button
            type="button"
            aria-label="Adedi azalt"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="h-10 w-9 text-lg disabled:opacity-30"
          >
            −
          </button>
          <span
            className="w-12 text-center text-sm font-bold"
            aria-live="polite"
          >
            {quantity} adet
          </span>
          <button
            type="button"
            aria-label="Adedi artır"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            disabled={quantity >= 20}
            className="h-10 w-9 text-lg disabled:opacity-30"
          >
            +
          </button>
        </div>

        {chosen.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="hidden text-xs font-semibold text-white/85 underline hover:text-white md:inline"
          >
            Bidonu boşalt
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (canAdd) addToCart();
            else if (!hasVegetable) scrollToStep("adim-malzeme");
            else if (!isFull) scrollToStep("adim-oran");
          }}
          disabled={pending}
          className="h-11 basis-full rounded-full bg-amber-400 px-7 text-sm font-extrabold whitespace-nowrap text-brand-dark transition hover:bg-amber-300 disabled:opacity-60 sm:basis-auto"
        >
          {cta}
          {canAdd && !pending && !justAdded
            ? ` · ${formatMoney(unit * quantity, currency)}`
            : ""}
        </button>
      </div>
    </div>
  );
}
