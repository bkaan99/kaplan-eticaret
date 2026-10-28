"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, type ReactNode } from "react";
import { EASE_OUT } from "@/components/motion/motion";
import { JarIcon } from "./icons";

/** Başlık kelimeleri maskenin altından sırayla yükselir. */
export function HeroTitle({
  words,
  className,
}: {
  /** `accent` kelimeler italik ve yeşil yazılır */
  words: { text: string; accent?: boolean }[];
  className?: string;
}) {
  return (
    <h1 className={className}>
      {words.map((word, index) => (
        <span key={index}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${word.accent ? "font-medium text-brand-leaf italic" : ""}`}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.15 + index * 0.07,
                ease: EASE_OUT,
              }}
            >
              {word.text}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </h1>
  );
}

interface LayerProps {
  src: string;
  alt?: string;
  width: number;
  height: number;
  /** Fare hareketine tepki miktarı (piksel); negatif ters yönde */
  depth: number;
  /** Giriş animasyonunun gecikmesi (sn) */
  delay: number;
  /** Süzülme döngüsünün süresi (sn) */
  float: number;
  rotate?: number;
  className: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

function Layer({
  src,
  alt = "",
  width,
  height,
  depth,
  delay,
  float,
  rotate = 0,
  className,
  mouseX,
  mouseY,
}: LayerProps) {
  const x = useTransform(mouseX, (value) => value * depth);
  const y = useTransform(mouseY, (value) => value * depth);

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.85, rotate: rotate - 8 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 1.1, delay, ease: EASE_OUT }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: float,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay + 1,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority
          className="h-auto w-full drop-shadow-[0_24px_30px_rgba(29,53,32,0.18)]"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Katmanlı hero sahnesi: kavanozlar sırayla yerine oturur, sonra hafifçe
 * süzülür; fare hareketiyle derinlik (parallax) verir, kaydırınca yukarı kayar.
 */
export function HeroScene({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const mouseY = useSpring(rawY, { stiffness: 60, damping: 18 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const layer = { mouseX, mouseY };

  return (
    <motion.div
      ref={ref}
      style={{ y: sceneY }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        rawX.set((event.clientX - rect.left) / rect.width - 0.5);
        rawY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      className="relative mx-auto aspect-[640/540] w-full max-w-lg"
      role="img"
      aria-label="Kaplan turşu kavanozları ve şalgam suyu şişesi"
    >
      {/* Arka plan daireleri */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[6%] rounded-full bg-[#f1e6c8]"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE_OUT }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute inset-[18%] rounded-full bg-[#e8dbb4]/70"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE_OUT }}
      />

      <Layer
        {...layer}
        src="/images/hero/kavanoz-biber.svg"
        width={220}
        height={330}
        depth={-10}
        delay={0.35}
        float={7}
        rotate={-6}
        className="top-[2%] left-[22%] w-[25%] opacity-90"
      />
      <Layer
        {...layer}
        src="/images/hero/kavanoz-karisik.svg"
        width={220}
        height={330}
        depth={18}
        delay={0.2}
        float={6}
        className="top-[4%] left-[38%] z-10 w-[36%]"
      />
      <Layer
        {...layer}
        src="/images/hero/kavanoz-salatalik.svg"
        width={220}
        height={330}
        depth={28}
        delay={0.45}
        float={5.5}
        rotate={-3}
        className="top-[30%] left-[8%] z-20 w-[30%]"
      />
      <Layer
        {...layer}
        src="/images/hero/sise-salgam.svg"
        width={160}
        height={340}
        depth={34}
        delay={0.6}
        float={6.5}
        rotate={4}
        className="top-[26%] right-[4%] z-20 w-[19%]"
      />
      <Layer
        {...layer}
        src="/images/hero/biber.svg"
        width={80}
        height={160}
        depth={50}
        delay={0.8}
        float={4.5}
        rotate={-35}
        className="right-[18%] bottom-[2%] z-30 w-[9%]"
      />
      <Layer
        {...layer}
        src="/images/hero/salatalik.svg"
        width={60}
        height={120}
        depth={44}
        delay={0.9}
        float={5}
        rotate={65}
        className="bottom-[0%] left-[14%] z-30 w-[9%]"
      />
      <Layer
        {...layer}
        src="/images/hero/dereotu.svg"
        width={60}
        height={110}
        depth={-20}
        delay={1}
        float={8}
        rotate={-10}
        className="top-[8%] left-[4%] w-[8%]"
      />

      {/* Dönen damga */}
      <motion.div
        className="absolute top-0 right-0 z-40 hidden h-28 w-28 items-center justify-center sm:flex"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 1.1 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 animate-[spin_18s_linear_infinite] motion-reduce:animate-none"
          aria-hidden="true"
        >
          <defs>
            <path
              id="stamp-circle"
              d="M50 50 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0"
            />
          </defs>
          <circle cx="50" cy="50" r="49" fill="#d4a017" />
          <text
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="2.4"
            fill="#1d3520"
          >
            <textPath href="#stamp-circle">
              EV USULÜ • DOĞAL • KATKISIZ •
            </textPath>
          </text>
        </svg>
        <JarIcon width={30} height={30} className="relative text-brand-dark" />
      </motion.div>
      {children}
    </motion.div>
  );
}
