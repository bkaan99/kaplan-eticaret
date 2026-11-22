/**
 * Bidondaki sebze oranları: %5'lik adımlar, toplam %100 (istemci ve sunucu ortak).
 * Oran yüzde olarak saklanır; arayüz bunu bidon ağırlığına göre grama çevirir
 * (3 kg'da bir adım 150 g, 5 kg'da 250 g, 10 kg'da 500 g).
 */
export const SHARE_STEP = 5;
export const FULL_SHARE = 100;

/** Yeni çeşit, bu kadar adımla (en az / en çok) bidona girer. */
export const ENTRY_MIN_STEPS = 2;
export const ENTRY_MAX_STEPS = 3;

export type PickleShares = Record<string, number>;

/** Bidon ağırlığı bilinmiyorsa 1 kg sayılır (fiyat hesabıyla aynı varsayım). */
function bidonGrams(weightGram: number | null | undefined): number {
  return weightGram && weightGram > 0 ? weightGram : 1000;
}

/** Bir oranın gram karşılığı. */
export function shareToGrams(
  share: number,
  weightGram: number | null | undefined,
): number {
  return Math.round((bidonGrams(weightGram) * share) / FULL_SHARE);
}

/** Bir dokunuşun (adımın) gram karşılığı. */
export function stepGrams(weightGram: number | null | undefined): number {
  return shareToGrams(SHARE_STEP, weightGram);
}

/** Yeni çeşidin girebileceği gram aralığı. */
export function entryRangeGrams(weightGram: number | null | undefined): {
  min: number;
  max: number;
} {
  const step = stepGrams(weightGram);
  return { min: step * ENTRY_MIN_STEPS, max: step * ENTRY_MAX_STEPS };
}

/** Sebzeleri adımlarla eşit dağıtır; artan paylar sıradaki ilk sebzelere gider. */
export function equalShares(ids: readonly string[]): PickleShares {
  if (ids.length === 0) return {};
  const steps = FULL_SHARE / SHARE_STEP;
  const each = Math.floor(steps / ids.length);
  const extra = steps - each * ids.length;
  return Object.fromEntries(
    ids.map((id, index) => [id, (each + (index < extra ? 1 : 0)) * SHARE_STEP]),
  );
}

export function totalShare(shares: PickleShares): number {
  return Object.values(shares).reduce((sum, share) => sum + share, 0);
}

/** Oran geçerli mi: tam olarak verilen sebzeler, en az bir adım, adımın katı, toplam %100. */
export function sharesAreValid(
  shares: PickleShares,
  vegetableIds: readonly string[],
): boolean {
  const keys = Object.keys(shares);
  return (
    keys.length === vegetableIds.length &&
    vegetableIds.every((id) => {
      const share = shares[id];
      return (
        share !== undefined &&
        Number.isInteger(share) &&
        share >= SHARE_STEP &&
        share % SHARE_STEP === 0
      );
    }) &&
    totalShare(shares) === FULL_SHARE
  );
}

/**
 * Bir sebzeyi bir adım artırır. Bidonda boş yer varsa oradan, doluysa en büyük
 * paydan alır; hiçbir paydan alınamıyorsa değişmez.
 */
export function increaseShare(shares: PickleShares, id: string): PickleShares {
  if (shares[id] === undefined) return shares;
  if (totalShare(shares) < FULL_SHARE) {
    return { ...shares, [id]: shares[id] + SHARE_STEP };
  }
  const donor = Object.entries(shares)
    .filter(([key, share]) => key !== id && share > SHARE_STEP)
    .sort((a, b) => b[1] - a[1])[0];
  if (!donor) return shares;
  return {
    ...shares,
    [id]: shares[id] + SHARE_STEP,
    [donor[0]]: donor[1] - SHARE_STEP,
  };
}

/** Bir sebzeyi bir adım azaltır (en az bir adım kalır); açılan yer boş kalır. */
export function decreaseShare(shares: PickleShares, id: string): PickleShares {
  const share = shares[id];
  if (share === undefined || share <= SHARE_STEP) return shares;
  return { ...shares, [id]: share - SHARE_STEP };
}

/**
 * Bidona yeni bir sebze ekler; mevcut oranlar (müşterinin elle ayarları) korunur.
 * Yeni çeşit 2-3 adımla girer (3 kg'da 300-450 g): önce boş yerden, yetmezse
 * en büyük paylardan birer adım alınarak. Bidondaki ilk sebze tamamını alır.
 */
export function addShare(shares: PickleShares, id: string): PickleShares {
  if (shares[id] !== undefined) return shares;
  const count = Object.keys(shares).length;
  if (count === 0) return { [id]: FULL_SHARE };

  const totalSteps = FULL_SHARE / SHARE_STEP;
  const wanted = Math.max(
    ENTRY_MIN_STEPS,
    Math.min(ENTRY_MAX_STEPS, Math.floor(totalSteps / (count + 1))),
  );

  const next: PickleShares = { ...shares };
  let entry = 0;
  let free = totalSteps - totalShare(next) / SHARE_STEP;
  while (entry < wanted && free > 0) {
    entry += 1;
    free -= 1;
  }
  while (entry < wanted) {
    const donor = Object.entries(next)
      .filter(([, share]) => share > SHARE_STEP)
      .sort((a, b) => b[1] - a[1])[0];
    if (!donor) break;
    next[donor[0]] = donor[1] - SHARE_STEP;
    entry += 1;
  }
  if (entry === 0) return shares;
  next[id] = entry * SHARE_STEP;
  return next;
}

/**
 * Bir sebzeyi çıkarır; açılan paylar kalan sebzelere en büyükten başlayarak
 * birer adım dağıtılır, böylece bidon dolu kalır ve oranlar korunur.
 */
export function removeShare(shares: PickleShares, id: string): PickleShares {
  const freed = shares[id];
  if (freed === undefined) return shares;
  const { [id]: _removed, ...rest } = shares;
  const ids = Object.keys(rest).sort((a, b) => rest[b]! - rest[a]!);
  if (ids.length === 0) return {};

  const next: PickleShares = { ...rest };
  // Boşta kalan payı da hesaba kat: yalnızca bu sebzenin payı dağıtılır.
  for (let steps = freed / SHARE_STEP, index = 0; steps > 0; steps -= 1) {
    const key = ids[index % ids.length]!;
    next[key] = next[key]! + SHARE_STEP;
    index += 1;
  }
  return next;
}
