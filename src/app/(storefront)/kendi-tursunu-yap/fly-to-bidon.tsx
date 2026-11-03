"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MAX_INGREDIENTS } from "@/modules/custom-pickle/custom-pickle.types";

/** İlk parçanın ağıza varış süresi (bidon içi görünümle senkron). */
export const FLY_TO_BIDON_MS = 520;

/**
 * Her çeşit için bidonda / uçuşta eşit parça sayısı.
 * 8 çeşit × bu değer = ağzına kadar dolu kapasite.
 */
export const PIECES_PER_KIND = 3;

/** Uçuşta biraz daha fazla yağmur hissi (görsel); bidonda yine PIECES_PER_KIND. */
const FLY_BURST_COUNT = PIECES_PER_KIND + 2;

type FlyShot = {
  key: string;
  imageUrl: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  midX: number;
  midY: number;
  size: number;
  spin: number;
  delay: number;
  duration: number;
};

type FlyDetail = {
  imageUrl: string;
  from: { left: number; top: number; width: number; height: number };
};

const EVENT = "kaplan:fly-to-bidon";

/** Malzeme kartından bidon ağzına eşit paylı çok parçalı uçuş. */
export function launchFlyToBidon(detail: FlyDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

function mouthPoint(): { x: number; y: number } | null {
  const el = document.querySelector("[data-bidon-mouth]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Sabit overlay: her eklenen çeşitten eşit miktarda parça uçar
 * (tek çeşit tüm bidonu doldurmaz; 8’de ağzına kadar dolar).
 */
export function FlyToBidonOverlay() {
  const [shots, setShots] = useState<FlyShot[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onFly(event: Event) {
      const detail = (event as CustomEvent<FlyDetail>).detail;
      if (!detail?.imageUrl || !detail.from) return;

      const mouth = mouthPoint();
      const baseFromX = detail.from.left + detail.from.width / 2;
      const baseFromY = detail.from.top + detail.from.height / 2;
      const baseToX = mouth?.x ?? Math.min(window.innerWidth * 0.28, 220);
      const baseToY = mouth?.y ?? Math.min(window.innerHeight * 0.35, 280);
      const baseSize = Math.max(36, Math.min(64, detail.from.width * 1.05));
      const batch = Date.now();
      const next: FlyShot[] = [];

      for (let i = 0; i < FLY_BURST_COUNT; i++) {
        const delay = i * 0.05;
        const duration = FLY_TO_BIDON_MS / 1000 + 0.06 + Math.random() * 0.1;
        const fromX = baseFromX + (Math.random() - 0.5) * 36;
        const fromY = baseFromY + (Math.random() - 0.5) * 28;
        const toX = baseToX + (Math.random() - 0.5) * 42;
        const toY = baseToY + (Math.random() - 0.5) * 18;
        const midX = (fromX + toX) / 2 + (Math.random() - 0.5) * 60;
        const midY = Math.min(fromY, toY) - (70 + Math.random() * 70);
        const size = baseSize * (0.72 + Math.random() * 0.4);
        const spin =
          (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 280);
        const key = `fly-${batch}-${i}`;

        next.push({
          key,
          imageUrl: detail.imageUrl,
          fromX,
          fromY,
          toX,
          toY,
          midX,
          midY,
          size,
          spin,
          delay,
          duration,
        });

        window.setTimeout(
          () => {
            setShots((current) => current.filter((s) => s.key !== key));
          },
          (delay + duration) * 1000 + 60,
        );
      }

      setShots((current) => [...current.slice(-MAX_INGREDIENTS * 4), ...next]);
    }

    window.addEventListener(EVENT, onFly);
    return () => window.removeEventListener(EVENT, onFly);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {shots.map((shot) => (
          <motion.img
            key={shot.key}
            src={shot.imageUrl}
            alt=""
            className="absolute top-0 left-0 rounded-xl object-contain drop-shadow-lg"
            style={{
              width: shot.size,
              height: shot.size,
              marginLeft: -shot.size / 2,
              marginTop: -shot.size / 2,
            }}
            initial={{
              x: shot.fromX,
              y: shot.fromY,
              scale: 0.85,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              x: [shot.fromX, shot.midX, shot.toX],
              y: [shot.fromY, shot.midY, shot.toY],
              scale: [1.05, 0.95, 0.5],
              rotate: [0, shot.spin * 0.5, shot.spin],
              opacity: [0, 1, 0.9],
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{
              duration: shot.duration,
              delay: shot.delay,
              ease: [0.22, 0.61, 0.36, 1],
              times: [0, 0.5, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
