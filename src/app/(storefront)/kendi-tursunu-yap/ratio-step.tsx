"use client";

import Image from "next/image";
import {
  entryRangeGrams,
  FULL_SHARE,
  SHARE_STEP,
  shareToGrams,
  stepGrams,
} from "@/modules/custom-pickle/custom-pickle.shares";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

/** 450 → "450 g", 2550 → "2.550 g" (adımlar gram olduğu için her zaman gram). */
export function formatGrams(grams: number) {
  return `${grams.toLocaleString("tr-TR")} g`;
}

export function RatioStep({ builder }: { builder: CustomPickleBuilderState }) {
  const {
    vegetables,
    shares,
    filled,
    isFull,
    changeShare,
    balanceShares,
    toggle,
    size,
  } = builder;
  const weight = size?.weightGram ?? null;
  const step = stepGrams(weight);
  const entry = entryRangeGrams(weight);
  const totalGrams = shareToGrams(FULL_SHARE, weight);
  const filledGrams = shareToGrams(filled, weight);
  const remainingGrams = totalGrams - filledGrams;

  return (
    <Step
      id="adim-oran"
      index={3}
      title="Tartıya koy"
      done={vegetables.length > 0 && isFull}
    >
      <p className="-mt-2 text-sm text-slate-600">
        Her dokunuş {formatGrams(step)} ekler veya çıkarır. Yeni çeşit{" "}
        {entry.min.toLocaleString("tr-TR")}–{formatGrams(entry.max)} ile girer.
        Bidon doluyken artırdığınız çeşit en büyük paydan alır.
      </p>
      {vegetables.length === 0 ? (
        <p className="rounded-xl bg-[#f4f5f0] px-4 py-5 text-center text-sm text-slate-500">
          Sebze seçtiğinizde gramajlar burada görünür.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {vegetables.map((item) => {
              const share = shares[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-[#fbfbf8] p-2.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Image
                      src={item.imageUrl ?? "/placeholder.svg"}
                      alt=""
                      width={36}
                      height={36}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-primary">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Bidonun %{share}&apos;i
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`${item.name} gramajını ${formatGrams(step)} azalt`}
                        disabled={share <= SHARE_STEP}
                        onClick={() => changeShare(item.id, -1)}
                        className="inline-flex h-11 w-11 min-h-11 items-center justify-center rounded-full border border-slate-200 text-primary disabled:opacity-30"
                      >
                        −
                      </button>
                      <span
                        aria-live="polite"
                        className="w-20 text-center text-sm font-bold text-primary tabular-nums"
                      >
                        {formatGrams(shareToGrams(share, weight))}
                      </span>
                      <button
                        type="button"
                        aria-label={`${item.name} gramajını ${formatGrams(step)} artır`}
                        onClick={() => changeShare(item.id, 1)}
                        className="inline-flex h-11 w-11 min-h-11 items-center justify-center rounded-full border border-slate-200 text-primary"
                      >
                        +
                      </button>
                    </span>
                    <button
                      type="button"
                      aria-label={`${item.name} malzemesini çıkar`}
                      onClick={() => toggle(item.id)}
                      className="inline-flex h-11 w-11 min-h-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-brand-pepper"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`text-sm font-bold ${isFull ? "text-primary" : "text-brand-pepper"}`}
            >
              {isFull
                ? `Bidon dolu · ${formatGrams(totalGrams)}`
                : `${formatGrams(filledGrams)} / ${formatGrams(totalGrams)} · kalan ${formatGrams(remainingGrams)}`}
            </span>
            <button
              type="button"
              onClick={balanceShares}
              className="rounded-full border border-primary px-4 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Eşit dağıt
            </button>
          </div>
        </>
      )}
    </Step>
  );
}
