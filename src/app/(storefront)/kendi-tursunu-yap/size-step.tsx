"use client";

import { motion } from "motion/react";
import { maxIngredientsForSize } from "@/modules/custom-pickle/custom-pickle.types";
import { type BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { formatMoney } from "@/shared/money";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

export function PepperIcons({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className={index < count ? "text-brand-pepper" : "text-border"}
        >
          <path
            fill="currentColor"
            d="M9 4c-1.5 4-1 9 3 16 2.5-5 3.5-10 2-16z"
          />
          <path
            d="M11 4c0-1.5 1-2.5 3-3"
            stroke="#2f5233"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </span>
  );
}

export function SizeThumb({
  active,
  label = "",
  index = 0,
  total = 3,
}: {
  active: boolean;
  label?: string;
  index?: number;
  total?: number;
}) {
  const shortLabel = label.replace(/\s*Bidon\s*/i, "").trim();
  // Boyut indeksine göre (örn. 1 kg -> küçük, 3 kg -> orta, 5 kg -> büyük)
  const scale =
    total > 1 ? 0.86 + (0.24 * Math.max(0, index)) / (total - 1) : 1;
  const width = Math.round(40 * scale);
  const height = Math.round(48 * scale);

  return (
    <div className="flex h-13 w-12 items-end justify-center">
      <svg
        viewBox="0 0 48 58"
        width={width}
        height={height}
        className={`shrink-0 transition-all duration-200 ${
          active ? "opacity-100 drop-shadow-xs" : "opacity-75 hover:opacity-95"
        }`}
        aria-hidden="true"
      >
        {/* Taban gölgesi */}
        <ellipse
          cx="24"
          cy="54"
          rx="16"
          ry="2.4"
          fill="#0b2318"
          opacity={active ? 0.2 : 0.12}
        />

        {/* Gövde — köşeli omuzlu sekizgen şeffaf bidon */}
        <path
          d="M17 15 H31 L39 23 V46 L35 51 H13 L9 46 V23 Z"
          fill={active ? "#f8faf5" : "#f4f6f2"}
        />

        {/* Dikiş çizgileri */}
        <path
          d="M17.5 24 V45 M30.5 24 V45"
          stroke="#c3cabd"
          strokeWidth="0.9"
        />

        {/* Sol yan yansıma parıltısı */}
        <path
          d="M11.8 25 V44"
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Ön Etiket (yeşil kenarlıklı krem zemin) */}
        <rect
          x="13.5"
          y="28.5"
          width="21"
          height="12"
          rx="1.5"
          fill="#f8f7ee"
          stroke="#1f5a27"
          strokeWidth="0.9"
        />

        {/* Etiket içi boyut yazısı */}
        <text
          x="24"
          y="36.5"
          textAnchor="middle"
          fontSize="5.5"
          fontWeight="800"
          fill="#1a4a22"
          letterSpacing="-0.2"
        >
          {shortLabel || "BİDON"}
        </text>

        {/* Etiket altı mini yeşil çizgi */}
        <line
          x1="16.5"
          y1="38.5"
          x2="31.5"
          y2="38.5"
          stroke="#2a6e33"
          strokeWidth="0.6"
          strokeLinecap="round"
        />

        {/* Gövde dış konturu */}
        <path
          d="M17 15 H31 L39 23 V46 L35 51 H13 L9 46 V23 Z"
          fill="none"
          stroke={active ? "#154734" : "#aeb6a9"}
          strokeWidth={active ? "1.6" : "1.3"}
          strokeLinejoin="round"
        />

        {/* Boyun */}
        <rect
          x="16"
          y="12.5"
          width="16"
          height="3"
          rx="0.6"
          fill="#eceee9"
          stroke="#b4bbae"
          strokeWidth="0.6"
        />

        {/* Kapak — yeşil vidalı kapak */}
        <path
          d="M14.5 13 V7 Q14.5 5 16.5 5 H31.5 Q33.5 5 33.5 7 V13 Z"
          fill={active ? "#154734" : "#1d5524"}
        />
        {/* Kapak üst pah / parlaklık */}
        <path
          d="M14.5 8 V7 Q14.5 5 16.5 5 H31.5 Q33.5 5 33.5 7 V8 Z"
          fill="#3f8a48"
        />
        {/* Kapak dişleri */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={16.2 + i * 2.9}
            y="8.8"
            width="0.9"
            height="3.6"
            rx="0.4"
            fill="#0b2a10"
            opacity="0.35"
          />
        ))}
      </svg>
    </div>
  );
}

export function SizeStep({
  sizes,
  builder,
}: {
  sizes: BuilderSize[];
  builder: CustomPickleBuilderState;
}) {
  const { variantId, selectSize, maxIngredients } = builder;

  return (
    <Step index={1} title="Bidon boyutu">
      <p className="-mt-2 text-sm text-muted-foreground">
        Seçili boyutta en fazla {maxIngredients} malzeme ekleyebilirsiniz.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {sizes.map((item, index) => {
          const active = item.variantId === variantId;
          const itemMax = maxIngredientsForSize(item.weightGram);
          return (
            <button
              key={item.variantId}
              type="button"
              aria-pressed={active}
              disabled={!item.inStock}
              onClick={() => selectSize(item.variantId)}
              className="relative flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-3 text-center transition-colors hover:border-primary/40 disabled:opacity-40 sm:p-4"
            >
              {active ? (
                <motion.span
                  layoutId="size-highlight"
                  aria-hidden="true"
                  className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              ) : null}
              <span className="relative">
                <SizeThumb
                  active={active}
                  label={item.label}
                  index={index}
                  total={sizes.length}
                />
              </span>
              <span className="relative flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-bold text-primary sm:text-base">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-foreground/80">
                  {item.inStock
                    ? formatMoney(item.price, item.currency)
                    : "Tükendi"}
                </span>
                <span className="text-xs text-muted-foreground">
                  En fazla {itemMax} malzeme
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Step>
  );
}
