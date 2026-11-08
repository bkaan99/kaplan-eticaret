"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MAX_INGREDIENTS } from "@/modules/custom-pickle/custom-pickle.types";
import { FLY_TO_BIDON_MS } from "./fly-to-bidon";
import {
  BODY,
  BODY_BOTTOM,
  BODY_TOP,
  BRAND_LINE,
  BRINE_COLOR,
  LID_CLOSE_AFTER_LAND_MS,
  SLOTS,
  SPICE_TINT,
  type SplashBurst,
  type SplashDrop,
} from "./bidon-constants";

export interface BidonItem {
  id: string;
  name: string;
  imageUrl: string | null;
  /** Sebze payı (%); verilirse parça sayısı paya göre belirlenir */
  share?: number;
}

export function Bidon({
  items,
  brine,
  spice,
  brineColor,
  spiceTint,
  hasBubbles,
  sizeLabel,
  maxIngredients = MAX_INGREDIENTS,
  fill,
  scale,
}: {
  items: BidonItem[];
  brine: string;
  spice: string;
  brineColor?: string;
  spiceTint?: number;
  hasBubbles?: boolean;
  sizeLabel: string;
  /** Seçili boyuttaki çeşit üst sınırı; salamura doluluk oranı buna göre. */
  maxIngredients?: number;
  /** Doluluk (0–1); verilmezse çeşit sayısından hesaplanır */
  fill?: number;
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
  const reduceMotion = useReducedMotion();

  // Salamura + parçalar: boyuttaki max çeşitte ağzına kadar dolu.
  const fillRatio =
    fill ?? Math.min(1, items.length / Math.max(1, maxIngredients));
  const level = 0.12 + fillRatio * 0.88;
  const liquidTop = BODY_BOTTOM - level * (BODY_BOTTOM - (BODY_TOP + 28));
  /** Max çeşitte her çeşit için kaç slot (tüm jar dolsun). */
  const piecesPerKind = Math.max(1, Math.floor(SLOTS.length / maxIngredients));
  const liquidFill =
    brineColor ?? BRINE_COLOR[brine as keyof typeof BRINE_COLOR] ?? "#d6e29a";
  const pepperOpacity =
    spiceTint !== undefined
      ? spiceTint
      : (SPICE_TINT[spice as keyof typeof SPICE_TINT] ?? 0.1);
  const showBubbles =
    hasBubbles !== undefined ? hasBubbles : brine === "NATURAL";

  const prevIdsRef = useRef<string[]>([]);
  const pendingTimersRef = useRef<number[]>([]);
  const lidCloseTimerRef = useRef<number | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    items.map((item) => item.id),
  );
  const [splashes, setSplashes] = useState<SplashBurst[]>([]);
  const [waveBoost, setWaveBoost] = useState(0);
  const [lidOpen, setLidOpen] = useState(false);
  const itemKey = items.map((item) => item.id).join("|");

  // Karttan uçuş bitsin → bidonda görünsün + sıçrama; kapak aç/kapa.
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

    // Her eklemede kapak hemen açılır; son inişten sonra kapanır.
    setLidOpen(true);
    if (lidCloseTimerRef.current !== null) {
      window.clearTimeout(lidCloseTimerRef.current);
      lidCloseTimerRef.current = null;
    }
    const closeAt = FLY_TO_BIDON_MS + LID_CLOSE_AFTER_LAND_MS;
    const closeTimer = window.setTimeout(() => {
      setLidOpen(false);
      lidCloseTimerRef.current = null;
    }, closeAt);
    lidCloseTimerRef.current = closeTimer;
    pendingTimersRef.current.push(closeTimer);

    for (const id of added) {
      const index = itemIds.indexOf(id);
      const countAfter = index + 1;
      // Bu çeşidin eşit pay slotları (alttan üste dolum)
      const bandStart = index * piecesPerKind;
      const slot =
        SLOTS[Math.min(bandStart + 1, SLOTS.length - 1)] ?? SLOTS[0]!;
      const nextFill = Math.min(1, countAfter / Math.max(1, maxIngredients));
      const nextLevel = 0.12 + nextFill * 0.88;
      const surfaceY =
        BODY_BOTTOM - nextLevel * (BODY_BOTTOM - (BODY_TOP + 28)) + 2;
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
  }, [itemKey, maxIngredients, piecesPerKind]);

  useEffect(() => {
    return () => {
      for (const timer of pendingTimersRef.current) window.clearTimeout(timer);
      pendingTimersRef.current = [];
      lidCloseTimerRef.current = null;
    };
  }, []);

  const visibleItems = items.filter((item) => visibleIds.includes(item.id));

  // Alttan üste sabit katman: yeni çeşit önceki yığının üstüne biner (yeniden dağıtılmaz).
  // Sebzeler bidondaki paylarıyla orantılı yer kaplar; aromalar birkaç parça.
  const pieceCounts = visibleItems.map((item) =>
    item.share !== undefined
      ? Math.max(1, Math.round((item.share / 100) * SLOTS.length * 0.85))
      : Math.min(2, piecesPerKind),
  );
  const jarPieces = visibleItems.flatMap((item, kindIndex) => {
    const startSlot = pieceCounts
      .slice(0, kindIndex)
      .reduce((sum, count) => sum + count, 0);
    return Array.from({ length: pieceCounts[kindIndex]! }, (_, pieceIndex) => {
      const slotIndex = startSlot + pieceIndex;
      if (slotIndex >= SLOTS.length) return null;
      const slot = SLOTS[slotIndex]!;
      return {
        key: `${item.id}-${pieceIndex}`,
        item,
        slot: {
          ...slot,
          x: slot.x + ((pieceIndex * 5) % 7) - 3,
          y: slot.y + ((pieceIndex * 3) % 5) - 2,
          r: slot.r + (pieceIndex % 3) * 3 - 3,
        },
        size: 40 + (pieceIndex % 3) * 2,
        /** Ağız hizasından kendi katmanına düşüş mesafesi */
        dropFrom: BODY_TOP + 18 - slot.y,
      };
    }).filter((piece): piece is NonNullable<typeof piece> => piece !== null);
  });

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
        <linearGradient id={plasticId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dfe4dc" stopOpacity="0.9" />
          <stop offset="10%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#f2f4f0" stopOpacity="0.25" />
          <stop offset="90%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d9dfd5" stopOpacity="0.9" />
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

      {/* Zemin gölgesi */}
      <ellipse cx="160" cy="408" rx="138" ry="11" fill={`url(#${shadowId})`} />

      {/* Gövde — şeffaf plastik */}
      <path d={BODY} fill="#f4f6f2" />
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

        {/* Malzemeler — ağızdan kendi katmanına düşüp üst üste yığılır */}
        <AnimatePresence>
          {jarPieces.map((piece, index) => {
            const { slot, item, size, dropFrom } = piece;
            const half = size / 2;
            const stagger = (index % piecesPerKind) * 0.05;
            return (
              <motion.g
                key={piece.key}
                initial={{
                  y: dropFrom,
                  opacity: 0.9,
                  rotate: slot.r - 18,
                  scale: 0.5,
                }}
                animate={{ y: 0, opacity: 1, rotate: slot.r, scale: 1 }}
                exit={{
                  y: 40,
                  opacity: 0,
                  scale: 0.6,
                  transition: { duration: 0.22 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  delay: stagger,
                }}
                style={{ transformOrigin: `${slot.x}px ${slot.y}px` }}
              >
                <motion.g
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 3 + (index % 4) * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6 + stagger,
                  }}
                >
                  <image
                    href={item.imageUrl ?? "/placeholder.svg"}
                    x={slot.x - half}
                    y={slot.y - half}
                    width={size}
                    height={size}
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

        {/* Kalıp dikiş çizgileri — omuz ve taban hizası + iki dikey panel */}
        <path
          d="M46 120 H274 M46 360 H274"
          stroke="#c9d0c4"
          strokeOpacity="0.7"
          strokeWidth="1.2"
        />
        <path
          d="M102 122 V358 M218 122 V358"
          stroke="#c3cabd"
          strokeOpacity="0.85"
          strokeWidth="1.6"
        />
        <path
          d="M103.5 124 V356 M219.5 124 V356"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="0.8"
        />

        {/* Yan parıltılar */}
        <path
          d="M60 134 V346"
          stroke="#ffffff"
          strokeOpacity="0.75"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M70 142 V330"
          stroke="#ffffff"
          strokeOpacity="0.25"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M258 142 V338"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M56 112 L88 80"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Parlaklık + ince kontur */}
      <path d={BODY} fill={`url(#${glossId})`} />
      <path
        d={BODY}
        fill="none"
        stroke="#aeb6a9"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Etiket */}
      <g>
        <rect
          x="84"
          y="240"
          width="152"
          height="52"
          rx="5"
          fill="#0b2318"
          opacity="0.08"
          transform="translate(0 2)"
        />
        <rect
          x="84"
          y="240"
          width="152"
          height="52"
          rx="5"
          fill="#f8f7ee"
          stroke="#1f5a27"
          strokeWidth="1.6"
        />
        <text
          x="160"
          y="273"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#1a4a22"
        >
          {sizeLabel || "Bidon"}
        </text>
        <text
          x="160"
          y="285"
          textAnchor="middle"
          fontSize="6.2"
          fontWeight="700"
          fill="#2a6e33"
          textLength="140"
          lengthAdjust="spacingAndGlyphs"
        >
          {BRAND_LINE}
        </text>
      </g>

      {/* Boş bidon ipucu */}
      <AnimatePresence>
        {items.length === 0 ? (
          <motion.g
            key="empty-hint"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <rect
              x="102"
              y="222"
              width="116"
              height="32"
              rx="16"
              fill="#ffffff"
              fillOpacity="0.94"
            />
            <text
              x="160"
              y="243"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#0b2318"
            >
              Çeşit seçin
            </text>
          </motion.g>
        ) : null}
      </AnimatePresence>

      {/* Uçuş hedefi */}
      <circle
        data-bidon-mouth
        cx="160"
        cy="62"
        r="8"
        fill="transparent"
        aria-hidden="true"
      />

      {/* Boyun halkası */}
      <rect x="86" y="56" width="148" height="12" rx="2" fill="#eceee9" />
      <rect
        x="86"
        y="56"
        width="148"
        height="12"
        rx="2"
        fill="none"
        stroke="#b4bbae"
        strokeWidth="1.2"
      />
      <path d="M88 63 H232" stroke="#d3d8cf" strokeWidth="1" />

      {/* Kapak — yeşil vidalı; açılınca sola kayar, azıcık havaya kalkar */}
      <motion.g
        initial={false}
        animate={{
          x: lidOpen ? (reduceMotion ? -36 : -88) : 0,
          y: lidOpen ? (reduceMotion ? -6 : -16) : 0,
          rotate: lidOpen ? (reduceMotion ? -6 : -10) : 0,
        }}
        transition={
          reduceMotion
            ? { duration: 0.01 }
            : lidOpen
              ? { type: "spring", stiffness: 280, damping: 22 }
              : { type: "spring", stiffness: 240, damping: 24 }
        }
      >
        <path
          d="M80 60 V32 Q80 24 88 24 H232 Q240 24 240 32 V60 Z"
          fill={`url(#${capId}-side)`}
        />
        <path
          d="M80 36 V32 Q80 24 88 24 H232 Q240 24 240 32 V36 Z"
          fill={`url(#${capId})`}
        />
        {Array.from({ length: 26 }, (_, index) => (
          <rect
            key={index}
            x={85 + index * 5.9}
            y="38"
            width="2.2"
            height="20"
            rx="1"
            fill="#0b2a10"
            opacity="0.22"
          />
        ))}
        <path
          d="M88 27 H232"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M80 59 H240"
          stroke="#0b2a10"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      </motion.g>
    </motion.svg>
  );
}
