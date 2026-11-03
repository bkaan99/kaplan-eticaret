"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

/** Kart → bidon ağız uçuş süresi (bidon içi düşüşle senkron). */
export const FLY_TO_BIDON_MS = 580;

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
};

type FlyDetail = {
  imageUrl: string;
  from: { left: number; top: number; width: number; height: number };
};

const EVENT = "kaplan:fly-to-bidon";

/** Malzeme kartından bidon ağzına uçuş başlatır. */
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
 * Sabit overlay: seçilen malzeme görseli karttan bidon ağzına
 * kavisli yolla uçar (Kemerburgaz tarzı, orijinal uygulama).
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
      const fromX = detail.from.left + detail.from.width / 2;
      const fromY = detail.from.top + detail.from.height / 2;
      const toX = mouth?.x ?? Math.min(window.innerWidth * 0.28, 220);
      const toY = mouth?.y ?? Math.min(window.innerHeight * 0.35, 280);
      const midX = (fromX + toX) / 2;
      const midY = Math.min(fromY, toY) - (90 + Math.random() * 50);
      const size = Math.max(40, Math.min(72, detail.from.width * 1.15));
      const key = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (220 + Math.random() * 200);

      setShots((current) => [
        ...current.slice(-4),
        { key, imageUrl: detail.imageUrl, fromX, fromY, toX, toY, midX, midY, size, spin },
      ]);

      window.setTimeout(() => {
        setShots((current) => current.filter((s) => s.key !== key));
      }, FLY_TO_BIDON_MS + 80);
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
              scale: 1.15,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: [shot.fromX, shot.midX, shot.toX],
              y: [shot.fromY, shot.midY, shot.toY],
              scale: [1.25, 1.05, 0.55],
              rotate: [0, shot.spin * 0.55, shot.spin],
              opacity: [1, 1, 0.85],
            }}
            exit={{ opacity: 0, scale: 0.35 }}
            transition={{
              duration: FLY_TO_BIDON_MS / 1000,
              ease: [0.22, 0.61, 0.36, 1],
              times: [0, 0.52, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
