/** Hazır karışımlar. Paneldeki malzeme adresleriyle eşleşir; eşleşmeyen malzeme atlanır. */
export interface PicklePreset {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  /** Malzeme adresi → sebze payı (aromalarda pay yoktur) */
  ingredients: { slug: string; share?: number }[];
  brine?: string;
  spice?: string;
}

export const PICKLE_PRESETS: PicklePreset[] = [
  {
    id: "bahce",
    name: "Bahçe Karışığı",
    tagline: "Salatalık, lahana, havuç, biber",
    badge: "Klasik",
    ingredients: [
      { slug: "salatalik", share: 30 },
      { slug: "beyaz-lahana", share: 30 },
      { slug: "havuc", share: 20 },
      { slug: "sivri-biber", share: 20 },
    ],
    brine: "VINEGAR",
    spice: "MEDIUM",
  },
  {
    id: "kahvalti",
    name: "Kahvaltılık",
    tagline: "Hafif ekşi, çıtır, acısız",
    badge: "Öneri",
    ingredients: [
      { slug: "kornison", share: 50 },
      { slug: "havuc", share: 30 },
      { slug: "karnabahar", share: 20 },
      { slug: "dereotu" },
    ],
    brine: "VINEGAR",
    spice: "MILD",
  },
  {
    id: "ates",
    name: "Ateş Sofrası",
    tagline: "Bol biberli, sarımsaklı, acılı",
    badge: "Öneri",
    ingredients: [
      { slug: "sivri-biber", share: 50 },
      { slug: "kirmizi-biber", share: 30 },
      { slug: "salatalik", share: 20 },
      { slug: "kuru-aci-biber" },
      { slug: "sarimsak" },
    ],
    brine: "VINEGAR",
    spice: "HOT",
  },
  {
    id: "kis",
    name: "Kış Sofrası",
    tagline: "Lahana, pancar, doğal fermente",
    badge: "Öneri",
    ingredients: [
      { slug: "beyaz-lahana", share: 40 },
      { slug: "kirmizi-lahana", share: 30 },
      { slug: "pancar", share: 30 },
      { slug: "sarimsak" },
    ],
    brine: "NATURAL",
    spice: "MILD",
  },
];
