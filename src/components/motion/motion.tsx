"use client";

import { MotionConfig, motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/** Yumuşak, "yerine oturan" geçiş eğrisi; vitrin animasyonlarının ortak dili. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** İşletim sisteminde "hareketi azalt" açıksa animasyonlar kapanır. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Görünüme girince aşağıdan yukarı belirir (bir kez). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.05 },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

type StaggerTag = "div" | "ul" | "ol";

/**
 * Çocuk `StaggerItem`'ları sırayla belirir. `onMount` true ise görünüme
 * girmeyi beklemeden, sayfa açılır açılmaz oynar (hero gibi).
 */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = 0.08,
  onMount = false,
}: {
  children: ReactNode;
  className?: string;
  as?: StaggerTag;
  stagger?: number;
  onMount?: boolean;
}) {
  const Component = motion[as];
  const trigger = onMount
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, amount: 0.1 } };

  return (
    <Component
      className={className}
      variants={containerVariants}
      custom={stagger}
      initial="hidden"
      {...trigger}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = motion[as];
  return (
    <Component className={className} variants={itemVariants}>
      {children}
    </Component>
  );
}
