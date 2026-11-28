"use client";

import { useId, type SVGProps } from "react";

/** Builder `bidon-constants` BODY ile birebir. */
export const BIDON_BODY =
  "M96 66 H224 Q230 66 234 70 L272 108 Q276 112 276 118 V360 Q276 366 272 371 L254 393 Q250 398 244 398 H76 Q70 398 66 393 L48 371 Q44 366 44 360 V118 Q44 112 48 108 L86 70 Q90 66 96 66 Z";

export interface BidonPreviewProps extends Omit<
  SVGProps<SVGSVGElement>,
  "fill"
> {
  /** Salamura rengi */
  liquidColor?: string;
  /** Etiket üst satırı */
  title?: string;
  /** Etiket alt satırı */
  subtitle?: string;
  /** Doluluk 0–1 (varsayılan ~0.72) */
  fill?: number;
}

/**
 * Builder’daki bidonun statik, yüksek detaylı önizlemesi.
 * Animasyon / malzeme yok; kart, sepet ve alt çubuk için.
 */
export function BidonPreview({
  liquidColor = "#e6edc2",
  title = "KAPLAN",
  subtitle = "KENDİ TURŞUN",
  fill = 0.72,
  className,
  width = 160,
  height = 210,
  ...props
}: BidonPreviewProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `${uid}-clip`;
  const plasticId = `${uid}-plastic`;
  const liquidId = `${uid}-liquid`;
  const glossId = `${uid}-gloss`;
  const capId = `${uid}-cap`;
  const shadowId = `${uid}-shadow`;

  const level = 0.12 + Math.min(1, Math.max(0, fill)) * 0.88;
  const liquidTop = 398 - level * (398 - 94);

  return (
    <svg
      viewBox="0 0 320 420"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BIDON_BODY} />
        </clipPath>
        <linearGradient id={plasticId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dfe4dc" stopOpacity="0.9" />
          <stop offset="10%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#f2f4f0" stopOpacity="0.25" />
          <stop offset="90%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d9dfd5" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="14%" stopColor={liquidColor} stopOpacity="0.92" />
          <stop offset="100%" stopColor={liquidColor} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0b2318" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={capId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f8a48" />
          <stop offset="45%" stopColor="#2a6e33" />
          <stop offset="100%" stopColor="#1f5a27" />
        </linearGradient>
        <linearGradient id={`${capId}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24632c" />
          <stop offset="55%" stopColor="#1d5524" />
          <stop offset="100%" stopColor="#123d18" />
        </linearGradient>
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0b2318" stopOpacity="0.2" />
          <stop offset="70%" stopColor="#0b2318" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#0b2318" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="408" rx="138" ry="11" fill={`url(#${shadowId})`} />

      <path d={BIDON_BODY} fill="#f4f6f2" />
      <path d={BIDON_BODY} fill={`url(#${plasticId})`} />

      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(0 ${liquidTop})`}>
          <path
            d="M-20 0 Q 40 -10 100 0 T 220 0 T 340 0 V 420 H -20 Z"
            fill={`url(#${liquidId})`}
          />
          <rect
            x="0"
            y="-2"
            width="320"
            height="8"
            fill="#ffffff"
            fillOpacity="0.35"
          />
          <path
            d="M-20 0 Q 40 -10 100 0 T 220 0 T 340 0 V 420 H -20 Z"
            fill={liquidColor}
            fillOpacity="0.22"
          />
        </g>

        <path
          d="M46 120 H274 M46 360 H274"
          stroke="#c9d0c4"
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d="M96 80 V390 M224 80 V390"
          stroke="#c9d0c4"
          strokeWidth="1"
          opacity="0.4"
        />
        <path
          d="M58 110 V350"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.35"
        />
      </g>

      <path d={BIDON_BODY} fill={`url(#${glossId})`} />
      <path
        d={BIDON_BODY}
        fill="none"
        stroke="#aeb6a9"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Etiket */}
      <rect
        x="92"
        y="168"
        width="136"
        height="58"
        rx="8"
        fill="#fffdf8"
        stroke="#1f5a27"
        strokeWidth="2"
      />
      <text
        x="160"
        y="192"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        letterSpacing="1.6"
        fill="#1f5a27"
      >
        {title}
      </text>
      <text
        x="160"
        y="210"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="9"
        letterSpacing="1.2"
        fill="#6b6a5a"
      >
        {subtitle}
      </text>

      {/* Boyun */}
      <rect
        x="112"
        y="48"
        width="96"
        height="22"
        rx="4"
        fill="#eceee9"
        stroke="#b4bbae"
        strokeWidth="1.2"
      />

      {/* Vida kapak */}
      <path
        d="M100 52 V28 Q100 18 112 18 H208 Q220 18 220 28 V52 Z"
        fill={`url(#${capId}-side)`}
      />
      <path
        d="M100 34 V28 Q100 18 112 18 H208 Q220 18 220 28 V34 Z"
        fill={`url(#${capId})`}
      />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={116 + i * 13}
          y="36"
          width="4"
          height="14"
          rx="1.5"
          fill="#0b2a10"
          opacity="0.28"
        />
      ))}
    </svg>
  );
}
