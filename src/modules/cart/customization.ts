import type Decimal from "decimal.js";

/**
 * Bir özelleştirilmiş satırın fiyatlandırma, geçerlilik ve sipariş snapshot verisi.
 */
export interface CustomizationQuote {
  /** Satır başına ek ücret (KDV dahil) */
  extra: Decimal;
  /** Özelleştirmede kullanılan bileşenler satışta ve aktif mi? */
  available: boolean;
  /** Satırda gösterilecek özet (örn: "Salatalık, Havuç · Sirkeli · Orta acı") */
  summary: string;
  /** Siparişe ve denetime yazılacak değişmez anlık kopya */
  snapshot: unknown;
}

/**
 * Özelleştirme fiyatlandırması ve analizi için sepet/checkout satır girdisi.
 */
export interface CustomizationLineItem {
  /** Özelleştirilmiş satırın tekil anahtarı (standart satırlarda boş veya tanımsız) */
  customizationKey?: string | null;
  /** Ham özelleştirme verisi (JSON nesnesi) */
  customization?: unknown;
  /** Satır varyant ağırlığı (gram cinsinden) */
  weightGram?: number | null;
  /** Varyant seçenek etiketleri (örn: ["5 kg bidon", "Sirkeli"]) */
  optionLabels?: string[];
}

/**
 * Ürün özelleştirme stratejisi / sağlayıcısı sözleşmesi (OCP - Open/Closed Principle).
 * Çekirdek sepet ve ödeme servisleri, sektöre/ürüne özgü mantığı (turşu, bidon, malzeme vb.)
 * katı kodlamak yerine bu arayüz üzerinden dinamik olarak yönetir.
 */
export interface ItemCustomizationHandler {
  /**
   * Bu ürünün özelleştirilebilir bir ürün olup olmadığını belirler.
   * Özelleştirilebilir ürünler standart addItem ile sepete eklenemez.
   */
  isCustomizable(productSlug: string): boolean;

  /**
   * Özelleştirilebilir bir ürün standart yoldan (malzeme seçilmeden)
   * eklenmek istendiğinde kullanıcıya gösterilecek hata mesajı.
   */
  getStandardAddErrorMessage?(productSlug: string): string;

  /**
   * Özel satır ekleme (addCustomItem) sırasında ürünün ve özelleştirme verisinin
   * geçerli olduğunu doğrular. Geçersizse ValidationError fırlatır.
   */
  validateCustomItem(productSlug: string, customization: unknown): void;

  /**
   * Satırların özelleştirme ek ücretlerini ve özetlerini hesaplar.
   * Özelleştirilmemiş veya geçersiz satırlar için listede aynı indekste undefined döner.
   */
  quote(
    lines: CustomizationLineItem[],
  ): Promise<(CustomizationQuote | undefined)[]>;
}
