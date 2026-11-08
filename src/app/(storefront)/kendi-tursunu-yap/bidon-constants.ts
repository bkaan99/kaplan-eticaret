"use client";

import {
  type BrineOption,
  type SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";

/** Parçalar indikten sonra kapağın kapanma gecikmesi. */
export const LID_CLOSE_AFTER_LAND_MS = 160;

/**
 * Bidon içi slotlar (alttan üste). Max çeşitte hepsi dolu görünür.
 * Köşeli omuzlu bidon: x≈60–260, y≈150–380.
 */
export const SLOTS = [
  // Katman 1 — taban
  { x: 74, y: 374, r: -12 },
  { x: 117, y: 378, r: 8 },
  { x: 161, y: 376, r: -6 },
  { x: 205, y: 371, r: 10 },
  { x: 244, y: 369, r: -8 },
  // Katman 2
  { x: 65, y: 340, r: 10 },
  { x: 106, y: 345, r: -10 },
  { x: 150, y: 348, r: 6 },
  { x: 193, y: 343, r: -8 },
  { x: 237, y: 338, r: 12 },
  // Katman 3
  { x: 71, y: 309, r: -8 },
  { x: 115, y: 314, r: 12 },
  { x: 159, y: 312, r: -12 },
  { x: 203, y: 307, r: 8 },
  { x: 244, y: 305, r: -6 },
  // Katman 4
  { x: 67, y: 279, r: 8 },
  { x: 111, y: 283, r: -10 },
  { x: 154, y: 281, r: 6 },
  { x: 198, y: 276, r: -6 },
  { x: 239, y: 274, r: 10 },
  // Katman 5
  { x: 76, y: 248, r: -10 },
  { x: 120, y: 252, r: 10 },
  { x: 163, y: 250, r: -8 },
  { x: 207, y: 245, r: 12 },
  { x: 246, y: 243, r: -4 },
  // Katman 6
  { x: 81, y: 217, r: 6 },
  { x: 124, y: 221, r: -10 },
  { x: 168, y: 219, r: 8 },
  { x: 212, y: 214, r: -6 },
  { x: 251, y: 212, r: 10 },
  // Katman 7
  { x: 88, y: 186, r: -8 },
  { x: 131, y: 190, r: 10 },
  { x: 175, y: 188, r: -12 },
  { x: 216, y: 183, r: 6 },
  { x: 253, y: 181, r: -8 },
  // Katman 8 — ağıza yakın (8. çeşit)
  { x: 97, y: 155, r: 8 },
  { x: 140, y: 160, r: -10 },
  { x: 182, y: 157, r: 6 },
  { x: 221, y: 152, r: -6 },
  { x: 255, y: 150, r: 10 },
];

/** Gövde iç alanı (clip + salamura) — y: 66 → 398 */
export const BODY_TOP = 66;

export const BODY_BOTTOM = 398;

/** Malzeme düşünce oluşan su sıçraması damlacıkları */
export type SplashDrop = {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
  delay: number;
};

export type SplashBurst = {
  id: string;
  x: number;
  y: number;
  drops: SplashDrop[];
};

/**
 * Köşeli omuzlu plastik bidon: dar boyun, eğik omuz, düz yan duvarlar,
 * pahlı taban köşeleri (sekizgen silüet).
 */
export const BODY =
  "M96 66 H224 Q230 66 234 70 L272 108 Q276 112 276 118 V360 Q276 366 272 371 L254 393 Q250 398 244 398 H76 Q70 398 66 393 L48 371 Q44 366 44 360 V118 Q44 112 48 108 L86 70 Q90 66 96 66 Z";

/** Etiket üstündeki marka satırı */
export const BRAND_LINE = "TARİHİ KEMERBURGAZ TURŞUCUSU · 1948";

export const BRINE_COLOR: Record<BrineOption, string> = {
  VINEGAR: "#d6e29a",
  NATURAL: "#e7d9a0",
};

export const SPICE_TINT: Record<SpiceOption, number> = {
  MILD: 0,
  MEDIUM: 0.1,
  HOT: 0.22,
};
