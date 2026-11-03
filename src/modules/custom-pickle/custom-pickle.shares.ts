/** Bidondaki sebze oranları: %10'luk adımlar, toplam %100 (istemci ve sunucu ortak). */
export const SHARE_STEP = 10;
export const FULL_SHARE = 100;

export type PickleShares = Record<string, number>;

/** Sebzeleri %10'luk adımlarla eşit dağıtır; artan paylar sıradaki ilk sebzelere gider. */
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
