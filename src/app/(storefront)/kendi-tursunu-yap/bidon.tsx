"use client";

import { AnimatePresence, motion } from "motion/react";
import type {
  BrineOption,
  SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";

/** Malzemelerin bidon içindeki yerleri (seçim sırasına göre doldurulur). */
const SLOTS = [
  { x: 108, y: 326, r: -18 },
  { x: 168, y: 334, r: 12 },
  { x: 226, y: 322, r: -8 },
  { x: 134, y: 270, r: 22 },
  { x: 200, y: 276, r: -20 },
  { x: 104, y: 214, r: 8 },
  { x: 166, y: 210, r: -14 },
  { x: 230, y: 222, r: 16 },
];

const BODY =
  "M120 75 L200 75 L200 92 C200 104 214 110 236 112 C256 114 270 128 270 150 L270 350 C270 370 254 384 234 384 L86 384 C66 384 50 370 50 350 L50 150 C50 128 64 114 84 112 C106 110 120 104 120 92 Z";

const BRINE_COLOR: Record<BrineOption, string> = {
  VINEGAR: "#d6e29a",
  NATURAL: "#e7d9a0",
};
const SPICE_TINT: Record<SpiceOption, number> = {
  MILD: 0,
  MEDIUM: 0.1,
  HOT: 0.22,
};

export interface BidonItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

export function Bidon({
  items,
  brine,
  spice,
  brineColor,
  spiceTint,
  hasBubbles,
  sizeLabel,
  scale,
}: {
  items: BidonItem[];
  brine: string;
  spice: string;
  brineColor?: string;
  spiceTint?: number;
  hasBubbles?: boolean;
  sizeLabel: string;
  /** Bidon boyutuna göre görsel ölçek (0.8–1) */
  scale: number;
}) {
  // Malzeme eklendikçe salamura yükselir.
  const level = Math.min(0.92, 0.22 + items.length * 0.088);
  const liquidTop = 384 - level * (384 - 120);
  const liquidFill =
    brineColor ??
    BRINE_COLOR[brine as keyof typeof BRINE_COLOR] ??
    "#d6e29a";
  const pepperOpacity =
    spiceTint !== undefined
      ? spiceTint
      : (SPICE_TINT[spice as keyof typeof SPICE_TINT] ?? 0.1);
  const showBubbles =
    hasBubbles !== undefined ? hasBubbles : brine === "NATURAL";

  return (
    <motion.svg
      viewBox="0 0 320 410"
      className="h-auto w-full"
      role="img"
      aria-label={`${sizeLabel} turşu bidonu: ${items.length ? items.map((item) => item.name).join(", ") : "henüz malzeme yok"}`}
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 95%" }}
    >
      <defs>
        <clipPath id="bidon-body">
          <path d={BODY} />
        </clipPath>
        <linearGradient id="bidon-plastic" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#eef1e6" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <ellipse
        cx="160"
        cy="394"
        rx="118"
        ry="12"
        fill="#1d3520"
        opacity="0.1"
      />

      {/* Sap */}
      <path
        d="M206 96 C 236 70, 286 86, 270 150"
        fill="none"
        stroke="#e3e7d8"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M206 96 C 236 70, 286 86, 270 150"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.6"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path d={BODY} fill="#f7f8f2" />

      <g clipPath="url(#bidon-body)">
        {/* Salamura */}
        <motion.g
          initial={false}
          animate={{ y: liquidTop }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
        >
          <motion.path
            d="M-160 0 Q -120 -10 -80 0 T 0 0 T 80 0 T 160 0 T 240 0 T 320 0 T 400 0 T 480 0 V 400 H -160 Z"
            fill={liquidFill}
            animate={{ x: [0, 160] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ fillOpacity: 0.85 }}
          />
          <motion.rect
            x="0"
            y="0"
            width="320"
            height="420"
            fill="#d9442b"
            initial={false}
            animate={{ opacity: pepperOpacity }}
            transition={{ duration: 0.6 }}
          />
        </motion.g>

        {/* Malzemeler */}
        <AnimatePresence>
          {items.slice(0, SLOTS.length).map((item, index) => {
            const slot = SLOTS[index]!;
            return (
              <motion.g
                key={item.id}
                initial={{ y: -320, opacity: 0, rotate: slot.r - 40 }}
                animate={{ y: 0, opacity: 1, rotate: slot.r }}
                exit={{ y: -320, opacity: 0, transition: { duration: 0.35 } }}
                transition={{ type: "spring", stiffness: 120, damping: 11 }}
                style={{ transformOrigin: `${slot.x}px ${slot.y}px` }}
              >
                <motion.g
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3 + (index % 3),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  }}
                >
                  <image
                    href={item.imageUrl ?? "/placeholder.svg"}
                    x={slot.x - 30}
                    y={slot.y - 30}
                    width="60"
                    height="60"
                  />
                </motion.g>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Doğal fermantasyonda kabarcıklar yükselir */}
        {showBubbles
          ? [70, 120, 160, 205, 245].map((x, index) => (
              <motion.circle
                key={x}
                cx={x}
                r={3 + (index % 3)}
                fill="#ffffff"
                fillOpacity="0.7"
                initial={{ cy: 380, opacity: 0 }}
                animate={{ cy: [380, liquidTop + 6], opacity: [0, 0.9, 0] }}
                transition={{
                  duration: 2.6 + index * 0.4,
                  repeat: Infinity,
                  delay: index * 0.5,
                  ease: "easeOut",
                }}
              />
            ))
          : null}
      </g>

      {/* Plastik parlaklığı ve kontur */}
      <path d={BODY} fill="url(#bidon-plastic)" fillOpacity="0.35" />
      <path d={BODY} fill="none" stroke="#cfd6c1" strokeWidth="3" />
      <path
        d="M68 160 V 340"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Etiket */}
      <g>
        <rect
          x="104"
          y="128"
          width="112"
          height="40"
          rx="10"
          fill="#fffdf8"
          stroke="#d4a017"
          strokeWidth="2.5"
        />
        <text
          x="160"
          y="146"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          fontWeight="700"
          letterSpacing="2"
          fill="#2f5233"
        >
          KAPLAN
        </text>
        <text
          x="160"
          y="160"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="8"
          letterSpacing="1.2"
          fill="#6b6a5a"
        >
          {sizeLabel.toLocaleUpperCase("tr")}
        </text>
      </g>

      {/* Kapak */}
      <rect x="112" y="40" width="96" height="40" rx="9" fill="#2f5233" />
      <rect x="112" y="40" width="96" height="10" rx="5" fill="#3d6642" />
      {Array.from({ length: 9 }, (_, index) => (
        <rect
          key={index}
          x={119 + index * 10}
          y="54"
          width="3.5"
          height="22"
          rx="1.75"
          fill="#1d3520"
          opacity="0.5"
        />
      ))}
    </motion.svg>
  );
}
