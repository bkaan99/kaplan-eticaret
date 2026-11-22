import type { PickleSpiceOption } from "./custom-pickle.types";

/**
 * Acılı malzemeler: bir malzemeye `spiceKey` atanmışsa, seçildiğinde bidonun
 * acılığı en az o seviyeye çıkar. Saf fonksiyonlar; arayüz durumundan bağımsızdır.
 */

/** Otomatik yükseltmenin kaydı: geri alınabilsin diye önceki seçim saklanır. */
export interface AutoSpice {
  /** Sistemin atadığı acılık seviyesi */
  key: string;
  /** Otomatik atamadan önce müşterinin seçtiği seviye */
  previous: string;
}

/** Seçili malzemelerin gerektirdiği en yüksek acılık seçeneği (yoksa null). */
export function requiredSpice(
  ingredients: readonly { spiceKey: string | null }[],
  spices: readonly PickleSpiceOption[],
): PickleSpiceOption | null {
  let hottest: PickleSpiceOption | null = null;
  for (const ingredient of ingredients) {
    if (!ingredient.spiceKey) continue;
    // Silinmiş veya pasif seçenek öneri üretmez.
    const option = spices.find(
      (item) => item.key === ingredient.spiceKey && item.isActive,
    );
    if (option && (!hottest || option.peppers > hottest.peppers)) {
      hottest = option;
    }
  }
  return hottest;
}

export interface ResolvedSpice {
  spice: string;
  auto: AutoSpice | null;
  /** Bu çağrıda acılık yükseltildiyse yeni seviye (kullanıcıyı bilgilendirmek için). */
  raised: PickleSpiceOption | null;
}

/**
 * Malzeme seçimi değiştiğinde acılığın ne olacağını belirler.
 *
 * - Gereken seviye mevcuttan yüksekse seviye yükseltilir (önceki seçim saklanır).
 * - Müşteri kendisi daha yüksek seçtiyse dokunulmaz.
 * - Sistem yükseltmişse ve gereken seviye düşmüş/kalkmışsa önceki seçime dönülür.
 * - Müşteri sonradan elle değiştirdiyse (`auto` temizlenir) geri alma yapılmaz.
 */
export function resolveSpice(input: {
  current: string;
  auto: AutoSpice | null;
  required: PickleSpiceOption | null;
  spices: readonly PickleSpiceOption[];
}): ResolvedSpice {
  const { current, auto, required, spices } = input;
  const peppers = (key: string) =>
    spices.find((item) => item.key === key)?.peppers ?? 0;

  // Sistemin atadığı seviye hâlâ geçerliyse, gereken seviyeye göre yeniden ayarla.
  if (auto && current === auto.key) {
    const base = auto.previous;
    const target =
      required && required.peppers > peppers(base) ? required.key : base;
    if (target === current) return { spice: current, auto, raised: null };
    const raised = target === base ? null : (required ?? null);
    return {
      spice: target,
      auto: target === base ? null : { key: target, previous: base },
      raised,
    };
  }

  if (required && required.peppers > peppers(current)) {
    return {
      spice: required.key,
      auto: { key: required.key, previous: current },
      raised: required,
    };
  }

  return { spice: current, auto: null, raised: null };
}
