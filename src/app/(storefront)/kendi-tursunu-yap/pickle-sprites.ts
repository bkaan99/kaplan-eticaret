/**
 * Gerçekçi 3D turşu parçaları (sprites) ve tabak ürün görselleri haritası.
 * Tarihi Kemerburgaz Turşucusu usulü derinlik, ışıklandırma ve doku referansıyla.
 */

export interface PickleSprite {
  url: string;
  width: number;
  height: number;
  kind: string;
}

const SHAPE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  gherkin: { w: 52, h: 28 }, // Salatalık, kornişon
  acur: { w: 54, h: 26 }, // Acur
  pepper: { w: 56, h: 24 }, // Sivri biber
  fatpep: { w: 46, h: 28 }, // Kırmızı biber, kapya
  chili: { w: 38, h: 20 }, // Kuru acı biber, süs biberi
  jalapeno: { w: 42, h: 24 }, // Jalapeno
  rpep: { w: 32, h: 32 }, // Kiraz biberi, top biber, hardal
  leaf: { w: 52, h: 36 }, // Beyaz / kırmızı lahana, dereotu, defne
  stick: { w: 50, h: 22 }, // Havuç
  cube: { w: 32, h: 32 }, // Pancar, nohut
  floret: { w: 36, h: 36 }, // Karnabahar
  tomato: { w: 36, h: 36 }, // Domates, yeşil domates
  apple: { w: 34, h: 34 }, // Ayva, elma
  bulb: { w: 34, h: 34 }, // Sarımsak
  bean: { w: 52, h: 20 }, // Fasulye
  okra: { w: 48, h: 22 }, // Bamya
  melon: { w: 42, h: 32 }, // Kelek
};

interface SpriteMapping {
  spriteSlug: string;
  kind: string;
}

const INGREDIENT_SLUG_MAP: Record<string, SpriteMapping> = {
  salatalik: { spriteSlug: "salatalik", kind: "gherkin" },
  kornison: { spriteSlug: "kornison", kind: "gherkin" },
  "beyaz-lahana": { spriteSlug: "beyaz-lahana", kind: "leaf" },
  lahana: { spriteSlug: "beyaz-lahana", kind: "leaf" },
  "kirmizi-lahana": { spriteSlug: "kirmizi-lahana", kind: "leaf" },
  havuc: { spriteSlug: "havuc", kind: "stick" },
  "sivri-biber": { spriteSlug: "sivri-biber", kind: "pepper" },
  "acili-kil-sivri-biber": { spriteSlug: "sivri-biber", kind: "pepper" },
  "acisiz-sivri-biber": { spriteSlug: "sivri-biber", kind: "pepper" },
  "kirmizi-biber": { spriteSlug: "kirmizi-biber", kind: "fatpep" },
  karnabahar: { spriteSlug: "karnabahar", kind: "floret" },
  pancar: { spriteSlug: "pancar", kind: "cube" },
  "yesil-domates": { spriteSlug: "yesil-domates", kind: "tomato" },
  domates: { spriteSlug: "yesil-domates", kind: "tomato" },
  "kirmizi-domates": { spriteSlug: "yesil-domates", kind: "tomato" },
  ayva: { spriteSlug: "ayva", kind: "apple" },
  elma: { spriteSlug: "ayva", kind: "apple" },
  sarimsak: { spriteSlug: "sarimsak", kind: "bulb" },
  "kuru-aci-biber": { spriteSlug: "kuru-aci-biber", kind: "chili" },
  "sus-biberi": { spriteSlug: "kuru-aci-biber", kind: "chili" },
  dereotu: { spriteSlug: "dereotu", kind: "leaf" },
  "defne-yapragi": { spriteSlug: "defne-yapragi", kind: "leaf" },
  nohut: { spriteSlug: "nohut", kind: "cube" },
  "hardal-tohumu": { spriteSlug: "hardal-tohumu", kind: "rpep" },
  jalapeno: { spriteSlug: "jalapeno", kind: "jalapeno" },
  fasulye: { spriteSlug: "fasulye", kind: "bean" },
  bamya: { spriteSlug: "bamya", kind: "okra" },
  kelek: { spriteSlug: "kelek", kind: "melon" },
  acur: { spriteSlug: "acur", kind: "acur" },
  "kiraz-biberi": { spriteSlug: "kiraz-biberi", kind: "rpep" },
  "top-biberi": { spriteSlug: "kiraz-biberi", kind: "rpep" },
};

export const AVAILABLE_PRODUCT_WEBP = new Set([
  "salatalik",
  "kornison",
  "beyaz-lahana",
  "kirmizi-lahana",
  "havuc",
  "sivri-biber",
  "kirmizi-biber",
  "karnabahar",
  "pancar",
  "yesil-domates",
  "ayva",
  "sarimsak",
  "kuru-aci-biber",
  "jalapeno",
  "fasulye",
  "bamya",
  "kelek",
  "acur",
  "kiraz-biberi",
]);

/**
 * Malzemenin bidon içine yerleşecek 3D hacimli parça görselini (sprite) döner.
 */
export function getPickleSprite(slugOrId: string, variant = 0): PickleSprite {
  const norm = slugOrId.toLowerCase().replace(/_/g, "-");
  const mapping = INGREDIENT_SLUG_MAP[norm] ?? {
    spriteSlug: "salatalik",
    kind: "gherkin",
  };
  const v = Math.abs(variant % 3);
  const dims = SHAPE_DIMENSIONS[mapping.kind] ?? { w: 42, h: 32 };

  return {
    url: `/images/sprites/${mapping.spriteSlug}-${v}.png`,
    width: dims.w,
    height: dims.h,
    kind: mapping.kind,
  };
}

/**
 * Malzemenin vitrin/kartta görünecek gerçek tabak ürün fotoğrafını döner.
 */
export function getPicklePlateImage(
  slugOrId: string,
  fallback?: string | null,
): string {
  const norm = slugOrId.toLowerCase().replace(/_/g, "-");
  if (AVAILABLE_PRODUCT_WEBP.has(norm)) {
    return `/images/malzemeler/${norm}.webp`;
  }
  return fallback ?? `/images/malzemeler/${norm}.svg`;
}
