"use client";

import Image from "next/image";
import { SHARE_STEP } from "@/modules/custom-pickle/custom-pickle.shares";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

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
  const kg = size?.weightGram ? size.weightGram / 1000 : 1;

  return (
    <Step id="adim-oran" index={3} title="Oranları ayarlayın">
      <p className="-mt-2 text-sm text-slate-600">
        Her adım %{SHARE_STEP}. Bidon doluyken birini artırınca en büyük paydan
        düşülür.
      </p>
      {vegetables.length === 0 ? (
        <p className="rounded-xl bg-[#f4f5f0] px-4 py-5 text-center text-sm text-slate-500">
          Sebze seçtiğinizde oranlar burada görünür.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {vegetables.map((item) => {
              const share = shares[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-2 sm:flex-row sm:items-center sm:gap-3"
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
                        {formatGrams((kg * share) / 100)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`${item.name} oranını azalt`}
                        disabled={share <= SHARE_STEP}
                        onClick={() => changeShare(item.id, -1)}
                        className="inline-flex h-11 w-11 min-h-11 items-center justify-center rounded-full border border-slate-200 text-primary disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-primary tabular-nums">
                        %{share}
                      </span>
                      <button
                        type="button"
                        aria-label={`${item.name} oranını artır`}
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
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-bold ${isFull ? "text-primary" : "text-brand-pepper"}`}
            >
              {isFull ? "Bidon dolu" : `Bidon %${filled} dolu`}
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

export function formatGrams(kg: number) {
  return kg >= 1
    ? `${kg.toLocaleString("tr-TR")} kg`
    : `${Math.round(kg * 1000)} g`;
}
