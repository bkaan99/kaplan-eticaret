"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type {
  BrineOption,
  SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import { FLY_TO_BIDON_MS } from "./fly-to-bidon";

/**
 * Malzemelerin bidon içindeki yerleri (seçim sırasına göre doldurulur).
 * Klasik tombik kavanoz: x≈50–270, salamura y≈210–388.
 */
const SLOTS = [
  { x: 108, y: 340, r: -12 },
  { x: 160, y: 348, r: 8 },
  { x: 212, y: 338, r: -8 },
  { x: 124, y: 286, r: 14 },
  { x: 192, y: 290, r: -14 },
  { x: 100, y: 232, r: 6 },
  { x: 160, y: 224, r: -10 },
  { x: 220, y: 234, r: 10 },
];

/** Gövde iç alanı (clip + salamura) — y: 96 → 388 */
const BODY_TOP = 96;
const BODY_BOTTOM = 388;

/** Malzeme düşünce oluşan su sıçraması damlacıkları */
type SplashDrop = {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
  delay: number;
};

type SplashBurst = {
  id: string;
  x: number;
  y: number;
  drops: SplashDrop[];
};

/**
 * Düz tombik kavanoz: geniş gövde, yumuşak omuz/taban, çizgisiz, tutamacsız.
 */
const BODY =
  "M112 96 C84 98 62 116 56 148 C50 180 50 230 54 290 C58 345 88 386 128 388 H192 C232 386 262 345 266 290 C270 230 270 180 264 148 C258 116 236 98 208 96 Z";

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
  const uid = useId().replace(/:/g, "");
  const clipId = `bidon-body-${uid}`;
  const plasticId = `bidon-plastic-${uid}`;
  const liquidId = `bidon-liquid-${uid}`;
  const glossId = `bidon-gloss-${uid}`;
  const shadowId = `bidon-shadow-${uid}`;
  const capId = `bidon-cap-${uid}`;

  // Malzeme eklendikçe salamura yükselir (uçuş sırasında da doluluk artar).
  const level = Math.min(0.92, 0.2 + items.length * 0.09);
  const liquidTop = BODY_BOTTOM - level * (BODY_BOTTOM - (BODY_TOP + 36));
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

  const prevIdsRef = useRef<string[]>([]);
  const pendingTimersRef = useRef<number[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    items.map((item) => item.id),
  );
  const [splashes, setSplashes] = useState<SplashBurst[]>([]);
  const [waveBoost, setWaveBoost] = useState(0);
  const itemKey = items.map((item) => item.id).join("|");

  // Karttan uçuş bitsin → bidonda görünsün + sıçrama.
  useEffect(() => {
    const itemIds = itemKey ? itemKey.split("|") : [];
    const prev = prevIdsRef.current;
    prevIdsRef.current = itemIds;

    const removed = prev.filter((id) => !itemIds.includes(id));
    if (removed.length) {
      setVisibleIds((current) => current.filter((id) => !removed.includes(id)));
    }

    const added = itemIds.filter((id) => !prev.includes(id));
    if (!added.length) return;

    for (const id of added) {
      const index = itemIds.indexOf(id);
      const slot = SLOTS[Math.min(Math.max(index, 0), SLOTS.length - 1)]!;
      const countAfter = index + 1;
      const nextLevel = Math.min(0.92, 0.2 + countAfter * 0.09);
      const surfaceY =
        BODY_BOTTOM - nextLevel * (BODY_BOTTOM - (BODY_TOP + 36)) + 2;
      const impactX = slot.x + (Math.random() - 0.5) * 18;
      const burstId = `splash-${id}-${Date.now()}`;

      const landTimer = window.setTimeout(() => {
        setVisibleIds((current) =>
          current.includes(id) ? current : [...current, id],
        );

        const drops: SplashDrop[] = Array.from({ length: 9 }, (_, i) => {
          const angle =
            -Math.PI / 2 + (i - 4) * 0.28 + (Math.random() - 0.5) * 0.2;
          const speed = 18 + Math.random() * 28;
          return {
            id: `${burstId}-d${i}`,
            x: impactX,
            y: surfaceY,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed - 8,
            r: 1.6 + Math.random() * 2.4,
            delay: i * 0.018,
          };
        });

        setSplashes((current) => [
          ...current.slice(-2),
          { id: burstId, x: impactX, y: surfaceY, drops },
        ]);
        setWaveBoost(1);
        pendingTimersRef.current.push(
          window.setTimeout(() => setWaveBoost(0), 900),
          window.setTimeout(() => {
            setSplashes((current) => current.filter((s) => s.id !== burstId));
          }, 1100),
        );
      }, FLY_TO_BIDON_MS);

      pendingTimersRef.current.push(landTimer);
    }
  }, [itemKey]);

  useEffect(() => {
    return () => {
      for (const timer of pendingTimersRef.current) window.clearTimeout(timer);
      pendingTimersRef.current = [];
    };
  }, []);

  const visibleItems = items.filter((item) => visibleIds.includes(item.id));

  return (
    <motion.svg
      viewBox="0 0 320 420"
      className="h-auto w-full"
      role="img"
      aria-label={`${sizeLabel} turşu bidonu: ${items.length ? items.map((item) => item.name).join(", ") : "henüz malzeme yok"}`}
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 95%" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={plasticId} x1="0" y1="0" x2="1" y2="0.12">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="22%" stopColor="#f4f7f0" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#e8eee0" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#cfd9c0" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="14%" stopColor={liquidFill} stopOpacity="0.92" />
          <stop offset="100%" stopColor={liquidFill} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0b2318" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={capId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="40%" stopColor="#f5d000" />
          <stop offset="100%" stopColor="#d4b000" />
        </linearGradient>
        <linearGradient id={`${capId}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c800" />
          <stop offset="100%" stopColor="#c9a600" />
        </linearGradient>
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0b2318" stopOpacity="0.2" />
          <stop offset="70%" stopColor="#0b2318" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#0b2318" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Zemin gölgesi */}
      <ellipse cx="160" cy="406" rx="128" ry="12" fill={`url(#${shadowId})`} />

      {/* Gövde — şeffaf plastik */}
      <path d={BODY} fill="#f3f6ef" />
      <path d={BODY} fill={`url(#${plasticId})`} />

      <g clipPath={`url(#${clipId})`}>
        {/* Salamura */}
        <motion.g
          initial={false}
          animate={{ y: liquidTop }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
        >
          <motion.path
            d="M-160 0 Q -120 -12 -80 0 T 0 0 T 80 0 T 160 0 T 240 0 T 320 0 T 400 0 T 480 0 V 420 H -160 Z"
            fill={`url(#${liquidId})`}
            animate={{
              x: [0, 160],
              scaleY: waveBoost > 0 ? [1, 1.08, 0.96, 1.04, 1] : 1,
            }}
            transition={{
              x: { duration: 4.5, repeat: Infinity, ease: "linear" },
              scaleY: { duration: 0.85, ease: "easeOut" },
            }}
            style={{ transformOrigin: "160px 0px" }}
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
          <motion.rect
            x="0"
            y="-2"
            width="320"
            height="14"
            fill="#ffffff"
            initial={false}
            animate={{ opacity: waveBoost > 0 ? [0.28, 0.55, 0.28] : 0.28 }}
            transition={{ duration: 0.7 }}
          />
        </motion.g>

        {/* Malzemeler — uçuş bitince ağızdan kısa düşüş */}
        <AnimatePresence>
          {visibleItems.slice(0, SLOTS.length).map((item, index) => {
            const slot = SLOTS[index]!;
            return (
              <motion.g
                key={item.id}
                initial={{
                  y: Math.min(0, 110 - slot.y),
                  opacity: 0.85,
                  rotate: slot.r - 25,
                  scale: 0.7,
                }}
                animate={{ y: 0, opacity: 1, rotate: slot.r, scale: 1 }}
                exit={{ y: -80, opacity: 0, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 160, damping: 14 }}
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
                    x={slot.x - 28}
                    y={slot.y - 28}
                    width="56"
                    height="56"
                  />
                </motion.g>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Su sıçraması */}
        <AnimatePresence>
          {splashes.map((burst) => (
            <g key={burst.id}>
              <motion.ellipse
                cx={burst.x}
                cy={burst.y}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                initial={{ rx: 6, ry: 2.5, opacity: 0.7 }}
                animate={{ rx: 42, ry: 10, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
              <motion.ellipse
                cx={burst.x}
                cy={burst.y}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.4"
                initial={{ rx: 4, ry: 1.5, opacity: 0.55 }}
                animate={{ rx: 28, ry: 7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              />
              <motion.ellipse
                cx={burst.x}
                cy={burst.y}
                fill="#ffffff"
                initial={{ rx: 10, ry: 4, opacity: 0.45 }}
                animate={{ rx: 18, ry: 5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
              {burst.drops.map((drop) => (
                <motion.circle
                  key={drop.id}
                  r={drop.r}
                  fill="#ffffff"
                  fillOpacity="0.85"
                  initial={{
                    cx: drop.x,
                    cy: drop.y,
                    opacity: 0.9,
                    scale: 0.6,
                  }}
                  animate={{
                    cx: drop.x + drop.dx,
                    cy: [drop.y, drop.y + drop.dy, drop.y + drop.dy * 0.2 + 22],
                    opacity: [0.9, 0.85, 0],
                    scale: [0.6, 1.15, 0.4],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.75,
                    delay: drop.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </g>
          ))}
        </AnimatePresence>

        {showBubbles
          ? [90, 120, 150, 180, 210, 240].map((x, index) => (
              <motion.circle
                key={x}
                cx={x}
                r={3 + (index % 3)}
                fill="#ffffff"
                fillOpacity="0.7"
                initial={{ cy: BODY_BOTTOM - 8, opacity: 0 }}
                animate={{
                  cy: [BODY_BOTTOM - 8, liquidTop + 10],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 2.6 + index * 0.35,
                  repeat: Infinity,
                  delay: index * 0.4,
                  ease: "easeOut",
                }}
              />
            ))
          : null}

        {/* Sol yansıma — hafif plastik parıltı */}
        <path
          d="M82 145 V 335"
          stroke="#ffffff"
          strokeOpacity="0.42"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M98 155 V 315"
          stroke="#ffffff"
          strokeOpacity="0.14"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Parlaklık + ince kontur */}
      <path d={BODY} fill={`url(#${glossId})`} />
      <path
        d={BODY}
        fill="none"
        stroke="#a3b492"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Uçuş hedefi */}
      <circle
        data-bidon-mouth
        cx="160"
        cy="78"
        r="8"
        fill="transparent"
        aria-hidden="true"
      />

      {/* Boyun */}
      <rect x="112" y="72" width="96" height="28" rx="6" fill="#e6ecdc" />
      <rect
        x="112"
        y="72"
        width="96"
        height="28"
        rx="6"
        fill="none"
        stroke="#9aab88"
        strokeWidth="1.5"
      />

      {/* Kapak — sarı vida, tırtıklı kenar */}
      <rect
        x="98"
        y="28"
        width="124"
        height="48"
        rx="8"
        fill={`url(#${capId}-side)`}
      />
      <rect x="98" y="28" width="124" height="18" rx="7" fill={`url(#${capId})`} />
      <rect x="118" y="22" width="84" height="10" rx="4" fill="#ffe566" />
      {Array.from({ length: 14 }, (_, index) => (
        <rect
          key={index}
          x={104 + index * 8.2}
          y="42"
          width="3.6"
          height="28"
          rx="1.2"
          fill="#b89600"
          opacity="0.4"
        />
      ))}
      <path
        d="M110 36 H210"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
