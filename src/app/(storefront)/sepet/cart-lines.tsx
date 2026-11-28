"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { BidonPreview } from "@/components/storefront/bidon-preview";
import { TrashIcon } from "@/components/storefront/icons";
import { Price } from "@/components/storefront/price";
import { refreshStorefrontShell } from "@/components/storefront/shell-events";
import type { CartLine, CartView } from "@/modules/cart/cart.types";
import { removeCartItemAction, updateCartQuantityAction } from "./actions";

const ISSUE_TEXT: Record<NonNullable<CartLine["issue"]>, string> = {
  OUT_OF_STOCK: "Bu ürün tükendi. Satın almak için sepetten çıkarın.",
  QUANTITY_REDUCED: "Stok azaldı, adedi güncelleyin.",
  UNAVAILABLE: "Bu ürün artık satışta değil.",
};

/** Aynı bidon boyutunun farklı malzemeli satırları ayrı tutulur. */
function lineId(line: CartLine): string {
  return line.lineKey ? `${line.variantId}-${line.lineKey}` : line.variantId;
}

function Line({ line, currency }: { line: CartLine; currency: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const max = Math.min(line.availableQuantity ?? 99, 99);
  const customLiquid =
    /kırmızı\s*su/i.test(line.variantLabel ?? "") ||
    /\bred\b/i.test(line.variantLabel ?? "")
      ? "#c8456f"
      : "#e6edc2";

  function update(quantity: number) {
    startTransition(async () => {
      const result = await updateCartQuantityAction(
        line.variantId,
        quantity,
        line.lineKey,
      );
      setError(result.ok ? null : (result.error ?? "Güncellenemedi"));
      if (result.ok) refreshStorefrontShell();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(line.variantId, line.lineKey);
      refreshStorefrontShell();
    });
  }

  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex gap-3 sm:gap-4">
        <div
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-theme ${
            line.isCustom
              ? "bg-linear-to-b from-[#f7f8f3] to-[#e3ecd8]"
              : "bg-muted"
          }`}
        >
          {line.isCustom ? (
            <BidonPreview
              width={70}
              height={92}
              liquidColor={customLiquid}
              className="drop-shadow-xs"
            />
          ) : (
            <Image
              src={line.imageUrl ?? "/placeholder.svg"}
              alt={line.productName}
              fill
              sizes="96px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href={
                  line.isCustom
                    ? "/kendi-tursunu-yap"
                    : `/urun/${line.productSlug}`
                }
                className="font-medium transition-colors hover:text-primary"
              >
                {line.productName}
              </Link>
              {line.isCustom ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  🥒 Özel Reçete
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label={`${line.productName} ürününü sepetten kaldır`}
              title="Sepetten kaldır"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 sm:hidden"
            >
              <TrashIcon width={17} height={17} />
            </button>
          </div>
          {line.variantLabel ? (
            <span className="text-sm text-muted-foreground">
              {line.variantLabel}
            </span>
          ) : null}
          <Price value={line.unitPrice} currency={currency} />

          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="sr-only" htmlFor={`qty-${lineId(line)}`}>
              Adet
            </label>
            <input
              id={`qty-${lineId(line)}`}
              type="number"
              min={1}
              max={max}
              defaultValue={line.quantity}
              disabled={pending || line.issue === "OUT_OF_STOCK"}
              onBlur={(event) => {
                const next = Math.floor(Number(event.target.value));
                if (next >= 1 && next !== line.quantity)
                  update(Math.min(next, max));
              }}
              className="min-h-11 w-20 rounded-theme border border-border px-2 py-2 text-sm"
            />
          </div>

          {line.issue ? (
            <p role="alert" className="text-sm text-red-600">
              {ISSUE_TEXT[line.issue]}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:justify-start sm:gap-2">
        <span className="font-semibold">
          <Price value={line.lineTotal} currency={currency} />
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`${line.productName} ürününü sepetten kaldır`}
          title="Sepetten kaldır"
          className="hidden h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 sm:inline-flex"
        >
          <TrashIcon width={15} height={15} />
          <span>Kaldır</span>
        </button>
      </div>
    </li>
  );
}

export function CartLines({ cart }: { cart: CartView }) {
  return (
    <ul>
      {cart.lines.map((line) => (
        <Line key={lineId(line)} line={line} currency={cart.currency} />
      ))}
    </ul>
  );
}
